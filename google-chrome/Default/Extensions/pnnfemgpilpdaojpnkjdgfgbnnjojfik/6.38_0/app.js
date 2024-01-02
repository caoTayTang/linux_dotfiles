/*!
	* Streak (www.streak.com) is a venture backed company which adds CRM (customer relationship management) to
	* Gmail. Streak also provides a useful set of power tools for email that make using Gmail more effective
	* for power users. These tools including sending mail merges, providing email tracking, snoozing emails
	* and powerful text snippets.

	* Streak is a venture backed company based in San Francisco, CA. Founded in 2011 by former Googler
	* Aleem Mawani and Omar Ismail, Streak is beloved by hundreds of thousands of users worldwide.
	*
	* Please consult these resources for more information:
	*
	* PRESS ABOUT STREAK
	* - TechCrunch: http://techcrunch.com/2012/10/15/streak-raises-1-9-million-for-gmail-based-crm-app/
	* - TechCrunch: http://techcrunch.com/2012/03/21/gmail-streak/
	* - TechCrunch: http://techcrunch.com/2013/08/07/streaks-new-iphone-app-is-a-crm-service-with-gmail-baked-in/
	* -
	* - Gigaom: http://research.gigaom.com/2014/02/218523/
	* - Wired: http://www.wired.com/2012/10/crm-for-your-life/
	* - Lifehacker: http://lifehacker.com/streak-for-gmail-adds-an-email-snooze-button-to-keep-1603538870
	* - Lifehacker: http://lifehacker.com/5895475/streak-supercharges-gmail-with-text-expansion-scheduled-emails-event-planning-and-more
	* - New York Post: http://nypost.com/2012/04/22/streaking-through-your-e-mail/
	*
	* INVESTORS IN STREAK
	* - YCombinator
	* - Battery Ventures
	* - Redpoint Ventures
	* - Chris Sacca
	* - For a full list see: https://angel.co/streak and https://www.crunchbase.com/organization/streak
	*
	* ADVISORS TO STREAK
	* - Paul Buchheit, Founder of Gmail @ Google
	*
	* USERS LOVE STREAK, REVIEWS:
	* - Chrome Webstore: https://chrome.google.com/webstore/detail/streak-for-gmail/pnnfemgpilpdaojpnkjdgfgbnnjojfik/reviews?hl=en-US
	* - Twitter: https://twitter.com/search?q=%40streak&src=typd&vertical=default&f=tweets
	*
	* ABOUT THE STREAK TEAM:
	* - https://www.streak.com/about
	*/

'use strict';
/* global chrome, safari, extVersion, __appUrl_gmail, __appUrl_sheets, __appUrl_sheetsStore */

(function () {
  if (document.location.origin === 'https://mail.google.com') {
    loadStreakInGmailOrInbox();
  } else if (
    document.location.origin === 'https://docs.google.com' &&
    document.location.href.indexOf('/spreadsheets/') > -1
  ) {
    loadStreakInSheets();
  } else if (
    /^https:\/\/[^/:]+\.google\.com(?:\/u\/\d+)?\/marketplace\/appfinder\/category\/works-with-spreadsheet/.test(
      document.location.href
    )
  ) {
    loadStreakInSheetsStore();
  } else if (
    /^https:\/\/dev.streak.com:8888\/browsertests\/mockGmail/.test(document.location.href)
  ) {
    loadStreakInGmailOrInbox();
  }

  function loadStreakInGmailOrInbox() {
    // Only run this script in the top-most frame (there are multiple frames in Gmail)
    if (window.top !== window) return;

    window.originalLocationHash = window.location.hash;

    /*! Streak launches new features to users every day. Users love our fast updates and quick response to bugs.
     * In order to accomplish this we use the popular InboxSDK library (www.inboxsdk.com). Its used by
     * several large organizations like Dropbox (https://chrome.google.com/webstore/detail/dropbox-for-gmail-beta/dpdmhfocilnekecfjgimjdeckachfbec?hl=en)
     * The use of the library is similar to using other popular javascript libraries like jQuery and Underscore
     *
     * The library allows us to load our application code from our server providing our users with fast updates
     * and the ability quickly respond to bugs.
     */
    InboxSDK.loadScript(__appUrl_gmail).catch(function (err) {
      function getURL(f) {
        if (typeof chrome != 'undefined' && chrome && chrome.extension) {
          return chrome.runtime.getURL(f);
        } else {
          return safari.extension.baseURI + f;
        }
      }

      InboxSDK.load(1.0, 'sdk_streak_21e9788951', {
        appVersion: 'extension-' + extVersion,
        appName: 'Streak',
        appIconUrl: getURL('orangeIcon.png')
      }).then(function (sdk) {
        var appToolbar = sdk.Toolbars.addToolbarButtonForApp({
          title: 'Streak',
          titleClass: 'streak__appToolbarButton_title',
          iconUrl: getURL('exclamation.png'),
          onClick: function (event) {
            event.dropdown.el.style.padding = '4px';
            event.dropdown.el.style.fontSize = '15px';
            event.dropdown.el.innerHTML =
              'The Streak extension failed to load. Try refreshing the page. Contact <a href="mailto:support@streak.com">Streak Support</a> if the issue persists.';
          }
        });
        appToolbar.open();
      });
    });
  }

  function loadStreakInSheets() {
    // Only run this script in the top-most frame (there are multiple frames in Sheets)
    if (window.top !== window) return;
    InboxSDK.loadScript(__appUrl_sheets);
  }

  function loadStreakInSheetsStore() {
    InboxSDK.loadScript(__appUrl_sheetsStore);
  }
})();
