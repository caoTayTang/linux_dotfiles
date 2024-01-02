initUI();

onClick("#reply", function() {
    location.href = localStorage["_composeUrl"];
});

onClick("#replyAll", function() {
    location.href = localStorage["_composeUrlReplyAll"];
});