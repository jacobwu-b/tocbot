var fs = require('fs');
var chai = require('chai');
var expect = chai.expect;
// Count all of the links from the io.js build page
var jsdom = require('jsdom');
var TEST_DATA = require('./data/json-data.js')();
var TEST_HTML = fs.readFileSync('./test/data/rendered.html').toString();

var GLOBAL = {
  window: {}
};

function spy(fn) {
  var args = [];
  var fun = function() {
    args.push([].slice.call(arguments));
    return fn(arguments);
  };
  fun._args = args;
  return fun;
}

var content = fs.readFileSync('./test/data/sample-meat.html').toString();
var markup = '<html><head></head><body>' + content + '</body></html>';

before(function(done) {
  jsdom.env(
    markup,
    [
      './build/assets/js/tocbot.js'
    ],
    function (err, window) {
      GLOBAL.window = window;
      done();
    }
  );
});

beforeEach(function() {
  GLOBAL.window.tocbot.init();
});

afterEach(function() {
  GLOBAL.window.tocbot.destroy();
});

describe('Tocbot', function () {
  describe('#init', function () {
    it('should expose a global object', function () {
      expect(GLOBAL.window.tocbot).to.not.equal(undefined);
    });

    it('should expose public functions', function () {
      expect(GLOBAL.window.tocbot.init).to.be.a('function');
      expect(GLOBAL.window.tocbot.destroy).to.be.a('function');
      expect(GLOBAL.window.tocbot.refresh).to.be.a('function');
    });

    it('should add event listeners when initialized', function () {
      GLOBAL.window.tocbot.destroy();
      var count = 0;
      var args = [];

      GLOBAL.window.document.addEventListener = function() {
        args.push([].slice.call(arguments));
        count++;
      };

      GLOBAL.window.tocbot.init();

      var eventTypes = args.map(function(arg) {
        return arg[0];
      });
      expect(eventTypes).to.contain('scroll');
      expect(eventTypes).to.contain('resize');
      expect(eventTypes).to.contain('click');
      // The 4th event is added by smooth-scroll.
      expect(count).to.equal(4);
    });
  });

  describe('#destroy', function () {
    it('should remove event listeners when destroyed', function () {
      var count = 0;
      var args = [];

      GLOBAL.window.document.removeEventListener = function() {
        args.push([].slice.call(arguments));
        count++;
      };

      GLOBAL.window.tocbot.destroy();

      var eventTypes = args.map(function(arg) {
        return arg[0];
      });
      expect(eventTypes).to.contain('scroll');
      expect(eventTypes).to.contain('resize');
      expect(eventTypes).to.contain('click');
      // The 4th event is added by smooth-scroll.
      expect(count).to.equal(4);
    });
  });
});

// Parse content
describe('Parse content', function () {
  it('#selectHeadings with default options', function () {
    var tocbot = GLOBAL.window.tocbot;
    var selectHeadings = tocbot._parseContent.selectHeadings;
    var defaultHeadings = selectHeadings(tocbot.options.contentSelector, tocbot.options.headingSelector);
    defaultHeadings = [].map.call(defaultHeadings, function(node) {
      return node.textContent;
    });

    expect(defaultHeadings).to.eql([
      'Bacon',
      'Brisket',
      'Flank',
      'Pork',
      'Capicola',
      'Drumstick',
      'Pastrami',
      'Meatloaf',
      'Sirloin',
      'Pork belly',
      'Bresaola shankle',
      'Cow pancetta',
      'Turducken',
      'Alcatra',
      'Chuck',
      'Spare ribs',
      'Swine venison chicken',
      'Landjaeger',
      'Kevin capicola shank'
    ]);
  });

  it('#selectHeadings with custom headingSelector option', function () {
    var tocbot = GLOBAL.window.tocbot;
    var selectHeadings = tocbot._parseContent.selectHeadings;
    var defaultHeadings = selectHeadings(tocbot.options.contentSelector, 'h1, h2');
    defaultHeadings = [].map.call(defaultHeadings, function(node) {
      return node.textContent;
    });

    expect(defaultHeadings).to.eql([
      'Bacon',
      'Brisket',
      'Flank',
      'Capicola',
      'Sirloin',
      'Pork belly',
      'Bresaola shankle',
      'Cow pancetta',
      'Swine venison chicken',
      'Landjaeger'
    ]);
  });

  it('#nestHeadingsArray', function () {
    var tocbot = GLOBAL.window.tocbot;
    var selectHeadings = tocbot._parseContent.selectHeadings;
    var defaultHeadings = selectHeadings(tocbot.options.contentSelector, tocbot.options.headingSelector);
    var nestHeadingsData = tocbot._parseContent.nestHeadingsArray(defaultHeadings);

    expect(nestHeadingsData.nest).to.eql(TEST_DATA);
  });
});

// Build HTML
describe('Build HTML', function () {
  it('#render', function () {
    var tocbot = GLOBAL.window.tocbot;
    var render = tocbot._buildHtml.render;
    var tocEl = render(tocbot.options.tocSelector, TEST_DATA);
    var html = TEST_HTML.split('\n').join('')
      .replace(/\>\s+\</g, '><'); // Remove spaces between all elements.

    expect(html).to.contain(tocEl.innerHTML);
  });
});
