document.querySelector('#cta-close').addEventListener('click', function (e) {
  window.close();
});

document.querySelector('#cta-main').addEventListener('click', function (e) {
  chrome.tabs.query(
    {
      url: '*://' + 'mail.google.com' + '/*'
    },
    function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, {
          active: true
        });
      } else {
        chrome.tabs.create({
          active: true,
          url: 'https://mail.google.com/'
        });
      }
    }
  );
});
