let gModal;
let currentHat;
// This URL is the same on every client to prevent evil hatters creating naughty images
let hatsURL = `https://raw.githubusercontent.com/the-dev-channel/mpp-hats/main/export`;
window.onload = function() {
function modalHandleEsc(evt) {
    if (evt.key == 'Escape') {
        closeModal();
    }
}

function openModal(selector, focus) {
    if (MPP.chat) MPP.chat.blur();
    // releaseKeyboard();
    $(document).on("keydown", modalHandleEsc);
    $("#modal #modals > *").hide();
    $("#modal").fadeIn(250);
    $(selector).show();
    setTimeout(function () {
        $(selector).find(focus).focus();
    }, 100);
    gModal = selector;
};

function closeModal() {
    $(document).off("keydown", modalHandleEsc);
    $("#modal").fadeOut(100);
    $("#modal #modals > *").hide();
    // captureKeyboard();
    gModal = null;
};

$(document.body).prepend(`
<style>
#names .name.me.no-after::after {
    content: none;
}
#cursors .cursor .name.no-after::after {
    content: none;
}
</style>
`);

let HatE = new EventEmitter();

MPP.client.on('hi', () => {
    MPP.client.on('custom', msg => {
        if(msg.data.m == "hat") {
            let p = MPP.client.ppl[msg.data._original_sender]; // Object.values(MPP.client.ppl).find(pp => {pp._id == msg._original_sender});
            // console.log(p);
            let hat = msg.data.hat;
            if (!p) return;
            HatE.emit('update hat', p, hat);
        }
        
        if(msg.data.m == "update hat") {
            let p = MPP.client.ppl[msg.data._original_sender]; // Object.values(MPP.client.ppl).find(pp => {pp._id == msg._original_sender});
            // console.log(p);
            let hat = msg.data.hat;
            if (!p) return;
            HatE.emit('update hat', p, hat);
        }

        if(msg.data.m == "?hat") {
            MPP.client.sendArray([{
                m:'custom',
                data:{
                    m: 'hat',
                    hat: currentHat
                }
            }]);
        }
    })
MPP.client.sendArray([{ m:'custom',data:{m:'?hat'}}]);
});


MPP.client.on('participant added', p => {
    HatE.emit('update hat', p);
});

MPP.client.on('participant update', p => {
    HatE.emit('update hat', p);
});



function load() {
    HatE.emit('load');
    MPP.client.off('ch', load);
}

MPP.client.on('ch', load);

class Hat {
    constructor(id, name) {
        this.id = id;
        this.name = name; // what the user sees
    }
}

function registerHats() {
    fetch('https://raw.githubusercontent.com/the-dev-channel/mpp-hats/main/hats.json').then(d => {return d.json()}).then(hatList => {
        for (let hat_id of Object.keys(hatList)) {
            let hat = new Hat(hat_id, hatList[hat_id]);
            let opt = `<option value="${hat.id}">${hat.name}</option>`;
            $('#hat-selector').append(opt);
        }
    });
}

HatE.on('update hat', (p, url) => {
    // setTimeout(() => { // timeout to fix race condition, apparently
        // name hat
        if (typeof url == 'undefined') return;
        if (url == '') return;
        $(p.nameDiv).children('.hat').remove();

        let top = '-8px';
        let left = '4px';

        // url = url || `https://raw.githubusercontent.com/the-dev-channel/mpp-hats/main/export/santa.png`;
        url = `${hatsURL}/${url}.png`;

        if (typeof MPP.client.channel.crown !== 'undefined') {
            if (MPP.client.channel.crown.participantId == p.id) {
                left = '20px';
            }
        }

        let hat = `<div class="hat"></div>`;
        $(p.nameDiv).append(hat);
        $(p.nameDiv).children('.hat').css({
            position: 'absolute',
            top, left,
            content: `url(${url})`,
            'z-index': 350
        });

        if (!p.cursorDiv) return;
        // cursor hat
        $(p.cursorDiv).children('.name').children('.cursorhat').remove();
        if ($(p.cursorDiv).children('.name').text() == $(p.cursorDiv).children('.name').html()) {
            $(p.cursorDiv).children('.name').html(`<p>${$(p.cursorDiv).children('.name').text()}</p>`)
        }

        top = '-10px';
        let right = '4px';

        let cursorHat = `<div class="cursorhat"></div>`;
        $($(p.cursorDiv).children('.name')).addClass('no-after');
        $(p.cursorDiv).children('.name').append(cursorHat);
        $(p.cursorDiv).children('.name').children('.cursorhat').css({
            position: 'absolute',
            top, right,
            content: `url(${url})`,
            'z-index': 350
        });

        if (typeof MPP.client.channel.crown !== 'undefined') {
            if (MPP.client.channel.crown.participantId == p.id) {
                // top = '-10px';
                if (url) {
                    right = '20px';
                } else {
                    right = '4px';
                }

                let cursorCrown = `<div class="cursorcrown"></div>`;
                // $($(p.cursorDiv).children('.name')).addClass('no-after');
                $(p.cursorDiv).children('.name').append(cursorCrown);
                $(p.cursorDiv).children('.name').children('.cursorcrown').css({
                    position: 'absolute',
                    top, right,
                    content: `url(/crown.png)`,
                    'z-index': 350
                });
            }
        }
    // }, 50);
});

function updateOwnHat(hat_id) {
    MPP.client.sendArray([{
        m:'custom',
        data:{
            m: 'update hat',
            url: hat_id
        }
    }]);
    HatE.emit('update hat', MPP.client.getOwnParticipant(), hat_id);
    HatE.emit('save hat', hat_id);
    currentHat = hat_id;
}

HatE.on('load', () => {
    // console.log("Loading hats...");
    // load own hat
    currentHat = localStorage.currentHat;

    // console.log('currentHat:', currentHat);

    MPP.client.sendArray([{
        m:'custom',
        data:{
            m: 'update hat',
            url: currentHat
        }
    }]);

    HatE.emit('update hat', MPP.client.getOwnParticipant(), currentHat);

    // add gui
    let btnOpenMenu = `<button id="hats-btn" class="top-button icon-button"><img src="${hatsURL}/tophat.png" /><p>Hats</p></button>`;
    $(btnOpenMenu).insertAfter('a[title="Multiplayer Piano Rules"]');

    $('#hats-btn').css({
        position: 'fixed',
        right: '6px',
        top: '58px',
        'z-index': 200,
        display: 'flex',
        width: '50px'
    });

    $('#hats-btn p,img').css({
        'margin-top': 'auto',
        'margin-bottom': 'auto',
        'margin-left': 'auto',
        'margin-right': 'auto'
    });

    let hatsModal = `
<div id="hats" class="dialog" style="height: 115px; margin-top: -90px; display: none;">
    <h4>Hats</h4>
    <hr />
    <p>
        <label>Select hat: &nbsp;
            <select id="hat-selector">
                <option value="">None</option>
            </select>
        </label>
    </p>
    <button class="submit">SUBMIT</button>
</div>
`;
    $('#modals').append(hatsModal);

    $('#hats-btn').on('click', evt => {
        openModal('#modal #modals #hats');
        $(`#modal #modals #hats #hat-selector option[value=${currentHat}]`).attr('selected', true);
    });

    $('#modal #modals #hats button.submit').on('click', () => {
        let selectedHat = $('#modal #modals #hats #hat-selector').val();
        updateOwnHat(selectedHat);
        closeModal();
    });

    registerHats();
});

HatE.on('save hat', hat_id => {
    localStorage.currentHat = hat_id;
});

MPP.client.on('a', msg => {
    let p = MPP.client.findParticipantById(msg.p.id);
    if (!p) return;
    let hatURL = $(p.nameDiv).children('.hat').css('content');

    if (!hatURL) return;

    let span = `<span class="hat"></span>`;
    let chatMessage = $('#chat ul li').last()
    $(chatMessage).children('.name').before(span);
    $(chatMessage).children('.hat').css('content', hatURL);
});

MPP.client.on('c', msg => {
    if (!msg.c) return;
    if (!Array.isArray(msg.c)) return;
    for (let i = 0; i < msg.c.length; i++) {
        // console.log(msg.c[i])
        let p = MPP.client.findParticipantById(msg.c[i].p.id);
        if (!p) continue;
        let hatURL = $(p.nameDiv).children('.hat').css('content');
        // console.log(hatURL)
        if (!hatURL) continue;

        let span = `<span class="hat"></span>`
        let chatMessage = $(`#chat ul li`)[i];
        $(chatMessage).children('.name').before(span);
        $(chatMessage).children('.hat').css('content', hatURL);
    }
});
}