'use strict';


let entered = false;

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('enter-overlay');
  const button = document.getElementById('enter-button');

  
  app.videoElement = document.getElementById('background');
  app.audioElement = document.getElementById('audio');

  if (button && overlay) {
    button.addEventListener('click', () => {
      entered = true;

      
      if (!app.shouldIgnoreVideo) {
        if (app.videoElement) { app.videoElement.muted = false; app.videoElement.play().catch(()=>{}); }
        if (app.audioElement) { app.audioElement.muted = false; app.audioElement.play().catch(()=>{}); }
      }

      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 600);
    });
  }
});



const ipgeolocation = 'https://api.ipgeolocation.io/ipgeo?apiKey=31ece79449854d1c8059ec105e82b33d';
const timeouts = [];

const mobileAndTabletCheck = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

$(document).ready(() => {
  const links = [
    { name: 'my free macro',   link: 'https://youjustgotiplogged.com/' },
    { name: 'cheapest tokens', link: 'https://youjustgotiplogged.com/' },
    { name: 'cheap robux',     link: 'https://youjustgotiplogged.com/' }
  ];

  for (let i in links) {
    let link = links[i];

    
    $('#marquee').append(`<a href="${link.link}" target="_blank">${link.name}</a>`);
    link = $('#marquee').children('a').last();

    if (i != links.length - 1)
      $('#marquee').append(' <img class="emoticon" src="assets/others/dot.png"> ');
  }

  if (mobileAndTabletCheck()) {
    $('#background').replaceWith(
      '<div id="background" style="background-image: url(assets/images/mobile-background.jpg);"></div>'
    );
    app.shouldIgnoreVideo = true;
  }

  app.titleChanger(['on top', 'exify', 'on top', 'exify', 'on top']);
  app.iconChanger([
    'assets/icons/rose1.jpg','assets/icons/rose2.jpg','assets/icons/rose3.jpg','assets/icons/rose4.jpg',
    'assets/icons/rose5.jpg','assets/icons/rose6.jpg','assets/icons/rose7.jpg','assets/icons/rose7.jpg',
    'assets/icons/rose1.jpg'
  ]);
});

if ($.cookie('videoTime')) {
  if (app.videoElement) app.videoElement.currentTime = $.cookie('videoTime');
  if (app.audioElement) app.audioElement.currentTime = $.cookie('videoTime');
}


document.addEventListener('contextmenu', (event) => event.preventDefault());


document.body.onkeyup = (event) => {
  if (event.keyCode == 32 && app.skippedIntro) {
    if (app.backgroundToggler) {
      if (entered && !app.shouldIgnoreVideo) {
        app.videoElement && app.videoElement.play();
        app.audioElement && app.audioElement.play();
      }
    } else {
      app.videoElement && app.videoElement.pause();
      app.audioElement && app.audioElement.pause();
    }
    return (app.backgroundToggler = !app.backgroundToggler);
  }
};

setInterval(() => { $('.troll').remove(); }, 600);

$('.skip').click(() => { skipIntro(); });

$.fn.extend({
  animateCss: function(animationName) {
    const animationEnd =
      'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';

    this.addClass(`animated ${animationName}`).one(animationEnd, () => {
      $(this).removeClass(`animated ${animationName}`);
    });

    return this;
  },
});

const writeLine = (text, speed, timeout, callback) => {
  timeout = typeof timeout === 'number' ? timeout : [0, (callback = timeout)];

  const lineNumber = app.id !== 2 ? ++app.id : (app.id += 2);

  setTimeout(() => {
    const typed = new Typed(`#line${lineNumber}`, {
      strings: text,
      typeSpeed: speed,
      onComplete: callback,
    });
  }, timeout);
};

$.getJSON(ipgeolocation, (data) => {
  writeLine(
    ['Authenticating...', "Granting access to <span style='font-size: 14px; color: #06d;'>[unknown]</span>..."],
    30,
    () => {
      if (app.skippedIntro) return;

      clearCursor();

      const usernames = ['user', 'dude'];

      const ip = data.ip ? data.ip : usernames[Math.floor(Math.random() * usernames.length)];
      const country = data.country_name ? data.country_name : 'your country';

      writeLine(
        [
          `Access granted! <span style='font-size: 14px; color: #0f0;'>[success]</span>`,
          `Welcome back, <i style='color: #0f0'>${ip}</i>! By the way, nice to see someone from ${country} here!`,
        ],
        30,
        500,
        () => {
          if (app.skippedIntro) return;

          clearCursor();

          writeLine([`<i style='color: #F62459'>made by @dq1h </i>`], 120, 500, () => {
            timeouts.push(
              setTimeout(() => {
                if (app.skippedIntro) return;

                clearCursor();

                setTimeout(() => {
                  skipIntro();
                }, 500);
              }, 1000)
            );
          });
        }
      );
    }
  );
});

const skipIntro = () => {
  if (app.skippedIntro) return;

  app.skippedIntro = true;

  timeouts.forEach((timeout) => {
    clearTimeout(timeout);
  });

  $('.top-right').remove();

  $('#main').fadeOut(100, () => {
    $('#main').remove();

    $('#marquee').marquee({
      duration: 15000,
      gap: 420,
      delayBeforeStart: 1000,
      direction: 'left',
      duplicated: true,
    });

    setTimeout(() => {
      $('.brand-header').animateCss(app.effects[Math.floor(Math.random() * app.effects.length)]);
    }, 200);

    setTimeout(() => {
      const typed = new Typed('#brand', {
        strings: app.brandDescription,
        typeSpeed: 40,
        onComplete: () => { clearCursor(); },
      });
    }, 1350);

    setTimeout(() => {
      if (!app.shouldIgnoreVideo && entered) {
        app.videoElement && app.videoElement.play();
        app.audioElement && app.audioElement.play();
      }

      if (app.videoElement) {
        app.videoElement.addEventListener(
          'timeupdate',
          () => { $.cookie('videoTime', app.videoElement.currentTime, { expires: 1 }); },
          false
        );
      }

      $('.marquee-container').css('visibility', 'visible').hide().fadeIn(100);
      $('.marquee-container').animateCss('zoomIn');
      $('.container').fadeIn();
      $('.background').fadeIn(200, () => {
        if (!app.shouldIgnoreVideo && entered && app.audioElement) {
          try { app.audioElement.volume = app.musicVolume || 0.5; } catch(e){}
        }
      });
    }, 200);
  });
};

const clearCursor = () => $('span').siblings('.typed-cursor').css('opacity', '0');

