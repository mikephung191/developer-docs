//= require ../lib/_lunr
//= require ../lib/_jquery
//= require ../lib/_jquery.highlight
;(function () {
  'use strict';

  var content, searchResults;
  var highlightOpts = { element: 'span', className: 'search-highlight' };
  var searchDelay = 0;
  var timeoutHandle = 0;

  var index = new lunr.Index();

  index.ref('id');
  index.field('title', { boost: 10 });
  index.field('body');
  index.pipeline.add(lunr.trimmer, lunr.stopWordFilter);

  $(populate);
  $(bind);

  function populate() {
    var beta = getParameterByName('beta', window.location.href);
    var betaParam = beta && beta.includes('platform-ui');
    var platform_ui_alpha = false;
    $('h1, h2').each(function() {
      var title = $(this);
      if (!betaParam) {
        var titleText = title.text();
        if (titleText.startsWith("Workflow Apps Overview") || titleText.startsWith("App Server")) {
          platform_ui_alpha = true;
        }
        if (titleText.startsWith("API Reference") || titleText.startsWith("News and Changelog")) {
          platform_ui_alpha = false;
        }
      }
      var body = title.nextUntil('h1, h2');
      if (!platform_ui_alpha) {
        index.add({
          id: title.prop('id'),
          title: title.text(),
          body: body.text()
        });
      }
    });

    determineSearchDelay();
  }
  function determineSearchDelay() {
    if(index.tokenStore.length>5000) {
      searchDelay = 300;
    }
  }

  function bind() {
    content = $('.content');
    searchResults = $('.search-results');

    $('#input-search').on('keyup',function(e) {
      var wait = function() {
        return function(executingFunction, waitTime){
          clearTimeout(timeoutHandle);
          timeoutHandle = setTimeout(executingFunction, waitTime);
        };
      }();
      wait(function(){
        search(e);
      }, searchDelay );
    });
  }

  function search(event) {
    var searchInputDom = $('#input-search');
    var searchInput = searchInputDom[0];

    unhighlight();
    searchResults.addClass('visible');
    searchInputDom.addClass('visible');

    // ESC clears the field
    if (event.keyCode === 27) searchInput.value = '';

    if (searchInput.value && searchInput.value.length > 2) {
      var results = index.search(searchInput.value).filter(function(r) {
        return r.score > 0.0001;
      });

      if (results.length) {
        searchResults.empty();
        $.each(results, function (index, result) {
          var elem = document.getElementById(result.ref);
          searchResults.append("<li><a href='#" + result.ref + "'>" + $(elem).text() + "</a></li>");
        });
        highlight.call(searchInput);
      } else {
        searchResults.html('<li><a></a></li>');
        $('.search-results a').text('No Results Found for "' + searchInput.value + '"');
      }
    } else {
      unhighlight();
      searchResults.removeClass('visible');
      searchInputDom.removeClass('visible');
    }
  }

  function highlight() {
    if (this.value) content.highlight(this.value, highlightOpts);
  }

  function unhighlight() {
    content.unhighlight(highlightOpts);
  }

  function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }
})();

