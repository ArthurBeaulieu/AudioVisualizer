import ColorUtils from '../src/js/utils/ColorUtils.js';
import CanvasUtils from '../src/js/utils/CanvasUtils.js';

const container = document.createElement('DIV');
container.className = 'container';
document.body.appendChild(container);

describe('AudioVisualizer unit test', () => {
  describe('ColorUtils unit test', () => {
    it('Getters', done => {
      expect(ColorUtils.defaultBackgroundColor).toEqual('#1D1E25');
      expect(ColorUtils.defaultTextColor).toEqual('#E7E9E7');
      expect(ColorUtils.defaultPrimaryColor).toEqual('#56D45B');
      expect(ColorUtils.defaultAntiPrimaryColor).toEqual('#FF6B67');
      expect(ColorUtils.defaultDarkPrimaryColor).toEqual('#12B31D');
      expect(ColorUtils.defaultLoopColor).toEqual('#FFAD67');
      expect(ColorUtils.defaultLoopAlphaColor).toEqual('rgba(255, 173, 103, 0.5)');
      expect(JSON.stringify(ColorUtils.defaultAudioGradient)).toEqual('[{"color":"#56D45B","index":0},{"color":"#AFF2B3","index":0.7},{"color":"#FFAD67","index":0.833},{"color":"#FF6B67","index":0.9},{"color":"#FFBAB8","index":1}]');
      done();
    });

    it('ColorUtils.alphaColor error handling', done => {
      expect(ColorUtils.alphaColor()).toEqual(new Error('ColorUtils.alphaColor : Missing arguments color or alpha'));
      expect(ColorUtils.alphaColor('FF0000')).toEqual(new Error('ColorUtils.alphaColor : Missing arguments color or alpha'));
      expect(ColorUtils.alphaColor(null, 0.5)).toEqual(new Error('ColorUtils.alphaColor : Missing arguments color or alpha'));
      expect(ColorUtils.alphaColor([], [])).toEqual(new Error('ColorUtils.alphaColor : Invalid type for color or alpha'));
      expect(ColorUtils.alphaColor('FF0000', [])).toEqual(new Error('ColorUtils.alphaColor : Invalid type for color or alpha'));
      expect(ColorUtils.alphaColor([], 0.5)).toEqual(new Error('ColorUtils.alphaColor : Invalid type for color or alpha'));
      expect(ColorUtils.alphaColor('NotAColor', 0.5)).toEqual(new Error('ColorUtils.alphaColor : Color is not a valid hexadecimal value'));
      expect(ColorUtils.alphaColor('FFFFFF', 42)).toEqual(new Error('ColorUtils.alphaColor : Alpha is not a valid float in [0, 1]'));
      expect(ColorUtils.alphaColor('FFFFFF', -42)).toEqual(new Error('ColorUtils.alphaColor : Alpha is not a valid float in [0, 1]'));
      done();
    });

    it('ColorUtils.alphaColor standard behavior', done => {
      expect(ColorUtils.alphaColor('FF0000', 0)).toEqual('rgba(255, 0, 0, 0)');
      expect(ColorUtils.alphaColor('FF0000', 0.5)).toEqual('rgba(255, 0, 0, 0.5)');
      expect(ColorUtils.alphaColor('0000FF', 1)).toEqual('rgba(0, 0, 255, 1)');
      expect(ColorUtils.alphaColor('00FF00', 1)).toEqual('rgba(0, 255, 0, 1)');
      expect(ColorUtils.alphaColor('FF0000', 1)).toEqual('rgba(255, 0, 0, 1)');
      expect(ColorUtils.alphaColor('#FF0000', 1)).toEqual('rgba(255, 0, 0, 1)');
      done();
    });

    it('ColorUtils.lightenDarkenColor error handling', done => {
      expect(ColorUtils.lightenDarkenColor()).toEqual(new Error('ColorUtils.lightenDarkenColor : Missing arguments color or amount'));
      expect(ColorUtils.lightenDarkenColor('FF0000')).toEqual(new Error('ColorUtils.lightenDarkenColor : Missing arguments color or amount'));
      expect(ColorUtils.lightenDarkenColor(null, 42)).toEqual(new Error('ColorUtils.lightenDarkenColor : Missing arguments color or amount'));
      expect(ColorUtils.lightenDarkenColor([], [])).toEqual(new Error('ColorUtils.lightenDarkenColor : Invalid type for color or amount'));
      expect(ColorUtils.lightenDarkenColor('FF0000', [])).toEqual(new Error('ColorUtils.lightenDarkenColor : Invalid type for color or amount'));
      expect(ColorUtils.lightenDarkenColor([], 42)).toEqual(new Error('ColorUtils.lightenDarkenColor : Invalid type for color or amount'));
      expect(ColorUtils.lightenDarkenColor('NotAColor', 0.5)).toEqual(new Error('ColorUtils.lightenDarkenColor : Color is not a valid hexadecimal value'));
      expect(ColorUtils.lightenDarkenColor('000000', 9999)).toEqual(new Error('ColorUtils.lightenDarkenColor : Amount is not a valid float in [-100, 100]'));
      expect(ColorUtils.lightenDarkenColor('FFFFFF', -9999)).toEqual(new Error('ColorUtils.lightenDarkenColor : Amount is not a valid float in [-100, 100]'));
      done();
    });

    it('ColorUtils.lightenDarkenColor standard behavior', done => {
      expect(ColorUtils.lightenDarkenColor('FF0000', 0)).toEqual('ff0000');
      expect(ColorUtils.lightenDarkenColor('000000', 10)).toEqual('1a1a1a');
      expect(ColorUtils.lightenDarkenColor('000000', 25)).toEqual('292929');
      expect(ColorUtils.lightenDarkenColor('000000', 50)).toEqual('424242');
      expect(ColorUtils.lightenDarkenColor('000000', 100)).toEqual('747474');
      expect(ColorUtils.lightenDarkenColor('FFFFFF', -10)).toEqual('e5e5e5');
      expect(ColorUtils.lightenDarkenColor('FFFFFF', -25)).toEqual('d6d6d6');
      expect(ColorUtils.lightenDarkenColor('FFFFFF', -50)).toEqual('bdbdbd');
      expect(ColorUtils.lightenDarkenColor('FFFFFF', -100)).toEqual('8b8b8b');
      done();
    });

    it('ColorUtils.rainbowLinearGradient error handling', done => {
      expect(ColorUtils.rainbowLinearGradient()).toEqual(new Error('ColorUtils.rainbowLinearGradient : Missing arguments canvas'));
      expect(ColorUtils.rainbowLinearGradient([])).toEqual(new Error('ColorUtils.rainbowLinearGradient : Invalid type for canvas or vertical'));
      expect(ColorUtils.rainbowLinearGradient(document.createElement('CANVAS'), {})).toEqual(new Error('ColorUtils.rainbowLinearGradient : Invalid type for canvas or vertical'));
      done();
    });

    it('ColorUtils.rainbowLinearGradient standard behavior', done => {
      const canvas = document.createElement('CANVAS');
      let calls = 0;
      spyOn(ColorUtils, 'linearGradient').and.callFake((canvas, options) => {
        if (calls === 0) {
          expect(JSON.stringify(options)).toEqual('{"vertical":false,"colors":[{"color":"red","index":0},{"color":"orange","index":0.14285714285714285},{"color":"yellow","index":0.2857142857142857},{"color":"green","index":0.42857142857142855},{"color":"blue","index":0.5714285714285714},{"color":"indigo","index":0.7142857142857143},{"color":"violet","index":0.8571428571428571},{"color":"red","index":1}]}');
          ++calls;
        } else {
          expect(JSON.stringify(options)).toEqual('{"vertical":true,"colors":[{"color":"red","index":0},{"color":"orange","index":0.14285714285714285},{"color":"yellow","index":0.2857142857142857},{"color":"green","index":0.42857142857142855},{"color":"blue","index":0.5714285714285714},{"color":"indigo","index":0.7142857142857143},{"color":"violet","index":0.8571428571428571},{"color":"red","index":1}]}');
          done();
        }
      });
      ColorUtils.rainbowLinearGradient(canvas);
      ColorUtils.rainbowLinearGradient(canvas, true);
    });

    it('ColorUtils.linearGradient error handling', done => {
      const canvas = document.createElement('CANVAS');
      expect(ColorUtils.linearGradient()).toEqual(new Error('ColorUtils.linearGradient : Missing arguments canvas or options'));
      expect(ColorUtils.linearGradient(canvas)).toEqual(new Error('ColorUtils.linearGradient : Missing arguments canvas or options'));
      expect(ColorUtils.linearGradient(canvas, 42)).toEqual(new Error('ColorUtils.linearGradient : Invalid type for canvas or options'));
      expect(ColorUtils.linearGradient(document.createElement('P'), {})).toEqual(new Error('ColorUtils.linearGradient : Invalid type for canvas or options'));
      expect(ColorUtils.linearGradient(canvas, { color: [] })).toEqual(new Error('ColorUtils.linearGradient : Options object is not properly formed'));
      expect(ColorUtils.linearGradient(canvas, { colors: {} })).toEqual(new Error('ColorUtils.linearGradient : Options object is not properly formed'));
      expect(ColorUtils.linearGradient(canvas, { colors: [{ index: 42, color: {} }] })).toEqual(new Error('ColorUtils.linearGradient : Invalid type for a color sent in options object'));
      expect(ColorUtils.linearGradient(canvas, { colors: [{ index: {}, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.linearGradient : Invalid type for a color sent in options object'));
      expect(ColorUtils.linearGradient(canvas, { colors: [{ index: 42, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.linearGradient : An index sent in options object is not a valid float in [0, 1]'));
      expect(ColorUtils.linearGradient(canvas, { colors: [{ index: -42, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.linearGradient : An index sent in options object is not a valid float in [0, 1]'));
      done();
    });

    it('ColorUtils.linearGradient standard behavior', done => {
      // Can't really test in depth ; trusting Canvas API as if previous test pass, the only instructions remaining are from it.
      expect(ColorUtils.linearGradient(document.createElement('CANVAS'), { colors: [{ index: 0, color: '#FFFFFF' }, { index: 1, color: 'red' }]}).toString()).toEqual('[object CanvasGradient]');
      done();
    });

    it('ColorUtils.radialGlowGradient error handling', done => {
      const canvas = document.createElement('CANVAS');
      expect(ColorUtils.radialGlowGradient()).toEqual(new Error('ColorUtils.radialGlowGradient : Missing arguments canvas or options'));
      expect(ColorUtils.radialGlowGradient(canvas)).toEqual(new Error('ColorUtils.radialGlowGradient : Missing arguments canvas or options'));
      expect(ColorUtils.radialGlowGradient(canvas, 42)).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for canvas or options'));
      expect(ColorUtils.radialGlowGradient(document.createElement('P'), {})).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for canvas or options'));
      expect(ColorUtils.radialGlowGradient(canvas, { color: [] })).toEqual(new Error('ColorUtils.radialGlowGradient : Options object is not properly formed'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: {} })).toEqual(new Error('ColorUtils.radialGlowGradient : Options object is not properly formed'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 42, color: {} }] })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for a color sent in options object'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: {}, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for a color sent in options object'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 42, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.radialGlowGradient : An index sent in options object is not a valid float in [0, 1]'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: -42, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.radialGlowGradient : An index sent in options object is not a valid float in [0, 1]'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.radialGlowGradient : Missing arguments options.centerX or options.centerY or options.radius'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], centerX: 'a', centerY: 'b', radius: 'c' })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], centerX: 10, centerY: 'b', radius: 'c' })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], centerX: 10, centerY: 'b', radius: 10 })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], centerX: 10, centerY: 10, radius: 'c' })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], centerX: 'a', centerY: 10, radius: 10 })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], centerX: 'a', centerY: 'b', radius: 10 })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius'));
      expect(ColorUtils.radialGlowGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], centerX: 'a', centerY: 10, radius: 'c' })).toEqual(new Error('ColorUtils.radialGlowGradient : Invalid type for options.centerX or options.centerY or options.radius'));
      done();
    });

    it('ColorUtils.radialGlowGradient standard behavior', done => {
      // Can't really test in depth ; trusting Canvas API as if previous test pass, the only instructions remaining are from it.
      expect(ColorUtils.radialGlowGradient(document.createElement('CANVAS'), { colors: [{ index: 0, color: '#FFFFFF' }, { index: 1, color: 'red' }], centerX: 10, centerY: 10, radius: 10 }).toString()).toEqual('[object CanvasGradient]');
      done();
    });

    it('ColorUtils.drawRadialGradient error handling', done => {
      const canvas = document.createElement('CANVAS');
      expect(ColorUtils.drawRadialGradient()).toEqual(new Error('ColorUtils.drawRadialGradient : Missing arguments canvas or options'));
      expect(ColorUtils.drawRadialGradient(canvas)).toEqual(new Error('ColorUtils.drawRadialGradient : Missing arguments canvas or options'));
      expect(ColorUtils.drawRadialGradient(canvas, 42)).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for canvas or options'));
      expect(ColorUtils.drawRadialGradient(document.createElement('P'), {})).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for canvas or options'));
      expect(ColorUtils.drawRadialGradient(canvas, { color: [] })).toEqual(new Error('ColorUtils.drawRadialGradient : Options object is not properly formed'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: {} })).toEqual(new Error('ColorUtils.drawRadialGradient : Options object is not properly formed'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 42, color: {} }] })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for a color sent in options object'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: {}, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for a color sent in options object'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 42, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.drawRadialGradient : An index sent in options object is not a valid float in [0, 1]'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: -42, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.drawRadialGradient : An index sent in options object is not a valid float in [0, 1]'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }] })).toEqual(new Error('ColorUtils.drawRadialGradient : Missing arguments options.x0 or options.y0 or options.r0'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 'a', y0: 'b', r0: 'c' })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x0 or options.y0 or options.r0'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 1, y0: 'b', r0: 'c' })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x0 or options.y0 or options.r0'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 'a', y0: 1, r0: 'c' })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x0 or options.y0 or options.r0'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 'a', y0: 'b', r0: 1 })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x0 or options.y0 or options.r0'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 1, y0: 2, r0: 3 })).toEqual(new Error('ColorUtils.drawRadialGradient : Missing arguments options.x1 or options.y1 or options.r1'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 1, y0: 2, r0: 3, x1: 'd', y1: 'e', r1: 'f' })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x1 or options.y1 or options.r1'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 1, y0: 2, r0: 3, x1: 1, y1: 'e', r1: 'f' })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x1 or options.y1 or options.r1'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 1, y0: 2, r0: 3, x1: 'd', y1: 1, r1: 'f' })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x1 or options.y1 or options.r1'));
      expect(ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: 'FFFFFF' }], x0: 1, y0: 2, r0: 3, x1: 'd', y1: 'e', r1: 1 })).toEqual(new Error('ColorUtils.drawRadialGradient : Invalid type for options.x1 or options.y1 or options.r1'));
      done();
    });

    it('ColorUtils.drawRadialGradient standard behavior', done => {
      // Can't really test in depth ; trusting Canvas API as if previous test pass, the only instructions remaining are from it.
      const canvas = document.createElement('CANVAS');
      const ctx = canvas.getContext('2d');

      spyOn(ctx, 'fillRect').and.callFake((x, y, w, h) => {
        expect(x).toEqual(0);
        expect(y).toEqual(0);
        expect(w).toEqual(300);
        expect(h).toEqual(150);
        expect(ctx.fillStyle.toString()).toEqual('[object CanvasGradient]');
        done();
      });

      ColorUtils.drawRadialGradient(canvas, { colors: [{ index: 0, color: '#FFFFFF' }, { index: 1, color: 'red' }], x0: 1, y0: 2, r0: 3, x1: 4, y1: 5, r1: 6 });
    });
  });

  describe('CanvasUtils unit test', () => {
    it('CanvasUtils.precisionRound error handling', done => {
      expect(CanvasUtils.precisionRound()).toEqual(new Error('CanvasUtils.precisionRound : Missing arguments value or precision'));
      expect(CanvasUtils.precisionRound(42)).toEqual(new Error('CanvasUtils.precisionRound : Missing arguments value or precision'));
      expect(CanvasUtils.precisionRound(null, 42)).toEqual(new Error('CanvasUtils.precisionRound : Missing arguments value or precision'));
      expect(CanvasUtils.precisionRound('42', '42')).toEqual(new Error('CanvasUtils.precisionRound : Invalid type for value or precision'));
      expect(CanvasUtils.precisionRound(42, '42')).toEqual(new Error('CanvasUtils.precisionRound : Invalid type for value or precision'));
      expect(CanvasUtils.precisionRound('42', 42)).toEqual(new Error('CanvasUtils.precisionRound : Invalid type for value or precision'));
      done();
    });

    it('CanvasUtils.precisionRound standard behavior', done => {
      expect(CanvasUtils.precisionRound(1 / 3, 0)).toEqual(0);
      expect(CanvasUtils.precisionRound(1 / 3, 3)).toEqual(0.333);
      expect(CanvasUtils.precisionRound(1 / 3, 6)).toEqual(0.333333);
      expect(CanvasUtils.precisionRound(-(1 / 3), 3)).toEqual(-0.333);
      expect(CanvasUtils.precisionRound(-(1 / 3), 6)).toEqual(-0.333333);
      expect(CanvasUtils.precisionRound(42, 6)).toEqual(42);
      expect(CanvasUtils.precisionRound(-42, 6)).toEqual(-42);
      expect(CanvasUtils.precisionRound(90071992547409911, 6)).toEqual(90071992547409911);
      done();
    });

    it('CanvasUtils.drawBeatCount error handling', done => {
      const canvas = document.createElement('CANVAS');
      expect(CanvasUtils.drawBeatCount()).toEqual(new Error('CanvasUtils.drawBeatCount : Missing arguments canvas or options'));
      expect(CanvasUtils.drawBeatCount(canvas)).toEqual(new Error('CanvasUtils.drawBeatCount : Missing arguments canvas or options'));
      expect(CanvasUtils.drawBeatCount(null, {})).toEqual(new Error('CanvasUtils.drawBeatCount : Missing arguments canvas or options'));
      expect(CanvasUtils.drawBeatCount(document.createElement('P'), {})).toEqual(new Error('CanvasUtils.drawBeatCount : Invalid type for canvas or options'));
      expect(CanvasUtils.drawBeatCount(canvas, 42)).toEqual(new Error('CanvasUtils.drawBeatCount : Invalid type for canvas or options'));
      expect(CanvasUtils.drawBeatCount(canvas, {})).toEqual(new Error('CanvasUtils.drawBeatCount : Missing arguments options.x or options.y or options.label'));
      expect(CanvasUtils.drawBeatCount(canvas, { x: 'a' })).toEqual(new Error('CanvasUtils.drawBeatCount : Missing arguments options.x or options.y or options.label'));
      expect(CanvasUtils.drawBeatCount(canvas, { x: 'a', y: 'b' })).toEqual(new Error('CanvasUtils.drawBeatCount : Missing arguments options.x or options.y or options.label'));
      expect(CanvasUtils.drawBeatCount(canvas, { x: 'a', y: 'b', label: 42 })).toEqual(new Error('CanvasUtils.drawBeatCount : Invalid type for options.x or options.y or options.label'));
      expect(CanvasUtils.drawBeatCount(canvas, { x: 'a', y: 'b', label: '42' })).toEqual(new Error('CanvasUtils.drawBeatCount : Invalid type for options.x or options.y or options.label'));
      expect(CanvasUtils.drawBeatCount(canvas, { x: 1, y: 'b', label: '42' })).toEqual(new Error('CanvasUtils.drawBeatCount : Invalid type for options.x or options.y or options.label'));
      done();
    });

    it('CanvasUtils.drawBeatCount standard behavior', done => {
      const canvas = document.createElement('CANVAS');
      const ctx = canvas.getContext('2d');
      container.appendChild(canvas);
      CanvasUtils.drawBeatCount(canvas, { x: 100, y: 75, label: 'Hello World' });
      expect(ctx.fillStyle).toEqual('#56d45b');
      expect(ctx.font).toEqual('bold 10pt sans-serif');
      expect(ctx.textAlign).toEqual('left');
      setTimeout(() => {
        container.removeChild(canvas);
        done();
      }, 500);
    });

    it('CanvasUtils.drawHotCue error handling', done => {
      const canvas = document.createElement('CANVAS');
      expect(CanvasUtils.drawHotCue()).toEqual(new Error('CanvasUtils.drawHotCue : Missing arguments canvas or options'));
      expect(CanvasUtils.drawHotCue(canvas)).toEqual(new Error('CanvasUtils.drawHotCue : Missing arguments canvas or options'));
      expect(CanvasUtils.drawHotCue(null, {})).toEqual(new Error('CanvasUtils.drawHotCue : Missing arguments canvas or options'));
      expect(CanvasUtils.drawHotCue(document.createElement('P'), {})).toEqual(new Error('CanvasUtils.drawHotCue : Invalid type for canvas or options'));
      expect(CanvasUtils.drawHotCue(canvas, 42)).toEqual(new Error('CanvasUtils.drawHotCue : Invalid type for canvas or options'));
      expect(CanvasUtils.drawHotCue(canvas, {})).toEqual(new Error('CanvasUtils.drawHotCue : Missing arguments options.x or options.y or options.size or options.label'));
      expect(CanvasUtils.drawHotCue(canvas, { x: 'a' })).toEqual(new Error('CanvasUtils.drawHotCue : Missing arguments options.x or options.y or options.size or options.label'));
      expect(CanvasUtils.drawHotCue(canvas, { x: 'a', y: 'b' })).toEqual(new Error('CanvasUtils.drawHotCue : Missing arguments options.x or options.y or options.size or options.label'));
      expect(CanvasUtils.drawHotCue(canvas, { x: 'a', y: 'b', size: 'c' })).toEqual(new Error('CanvasUtils.drawHotCue : Missing arguments options.x or options.y or options.size or options.label'));
      expect(CanvasUtils.drawHotCue(canvas, { x: 'a', y: 'b', size: 'c', label: 42 })).toEqual(new Error('CanvasUtils.drawHotCue : Invalid type for options.x or options.y or options.size or options.label'));
      expect(CanvasUtils.drawHotCue(canvas, { x: 'a', y: 'b', size: 'c', label: '42' })).toEqual(new Error('CanvasUtils.drawHotCue : Invalid type for options.x or options.y or options.size or options.label'));
      expect(CanvasUtils.drawHotCue(canvas, { x: 'a', y: 'b', size: 1, label: '42' })).toEqual(new Error('CanvasUtils.drawHotCue : Invalid type for options.x or options.y or options.size or options.label'));
      expect(CanvasUtils.drawHotCue(canvas, { x: 'a', y: 1, size: 1, label: '42' })).toEqual(new Error('CanvasUtils.drawHotCue : Invalid type for options.x or options.y or options.size or options.label'));
      done();
    });

    it('CanvasUtils.drawHotCue standard behavior', done => {
      const canvas = document.createElement('CANVAS');
      const ctx = canvas.getContext('2d');
      container.appendChild(canvas);
      CanvasUtils.drawHotCue(canvas, { x: 142, y: 75, size: 16, label: '42' });
      expect(ctx.fillStyle).toEqual('#1d1e25');
      expect(ctx.font).toEqual('bold 8pt sans-serif');
      expect(ctx.textAlign).toEqual('center');
      setTimeout(() => {
        container.removeChild(canvas);
        done();
      }, 500);
    });

    it('CanvasUtils.drawTriangle error handling', done => {
      const canvas = document.createElement('CANVAS');
      expect(CanvasUtils.drawTriangle()).toEqual(new Error('CanvasUtils.drawTriangle : Missing arguments canvas or options'));
      expect(CanvasUtils.drawTriangle(canvas)).toEqual(new Error('CanvasUtils.drawTriangle : Missing arguments canvas or options'));
      expect(CanvasUtils.drawTriangle(null, {})).toEqual(new Error('CanvasUtils.drawTriangle : Missing arguments canvas or options'));
      expect(CanvasUtils.drawTriangle(document.createElement('P'), {})).toEqual(new Error('CanvasUtils.drawTriangle : Invalid type for canvas or options'));
      expect(CanvasUtils.drawTriangle(canvas, 42)).toEqual(new Error('CanvasUtils.drawTriangle : Invalid type for canvas or options'));
      expect(CanvasUtils.drawTriangle(canvas, {})).toEqual(new Error('CanvasUtils.drawTriangle : Missing arguments options.x or options.y or options.radius or options.top'));
      expect(CanvasUtils.drawTriangle(canvas, { x: 'a' })).toEqual(new Error('CanvasUtils.drawTriangle : Missing arguments options.x or options.y or options.radius or options.top'));
      expect(CanvasUtils.drawTriangle(canvas, { x: 'a', y: 'b' })).toEqual(new Error('CanvasUtils.drawTriangle : Missing arguments options.x or options.y or options.radius or options.top'));
      expect(CanvasUtils.drawTriangle(canvas, { x: 'a', y: 'b', radius: 'c' })).toEqual(new Error('CanvasUtils.drawTriangle : Missing arguments options.x or options.y or options.radius or options.top'));
      expect(CanvasUtils.drawTriangle(canvas, { x: 'a', y: 'b', radius: 'c', top: 42 })).toEqual(new Error('CanvasUtils.drawTriangle : Invalid type for options.x or options.y or options.radius or options.top'));
      expect(CanvasUtils.drawTriangle(canvas, { x: 'a', y: 'b', radius: 1, top: 42 })).toEqual(new Error('CanvasUtils.drawTriangle : Invalid type for options.x or options.y or options.radius or options.top'));
      expect(CanvasUtils.drawTriangle(canvas, { x: 'a', y: 1, radius: 1, top: 42 })).toEqual(new Error('CanvasUtils.drawTriangle : Invalid type for options.x or options.y or options.radius or options.top'));
      done();
    });

    it('CanvasUtils.drawTriangle standard behavior', done => {
      const canvas = document.createElement('CANVAS');
      const ctx = canvas.getContext('2d');
      container.appendChild(canvas);
      CanvasUtils.drawTriangle(canvas, { x: 142, y: 75, radius: 16, top: 42 });
      expect(ctx.fillStyle).toEqual('#000000');
      expect(ctx.font).toEqual('10px sans-serif');
      expect(ctx.textAlign).toEqual('start');
      setTimeout(() => {
        container.removeChild(canvas);
        done();
      }, 500);
    });

    it('CanvasUtils.drawPeakMeter error handling', done => {
      const canvas = document.createElement('CANVAS');
      expect(CanvasUtils.drawPeakMeter()).toEqual(new Error('CanvasUtils.drawPeakMeter : Missing arguments canvas or options'));
      expect(CanvasUtils.drawPeakMeter(canvas)).toEqual(new Error('CanvasUtils.drawPeakMeter : Missing arguments canvas or options'));
      expect(CanvasUtils.drawPeakMeter(null, {})).toEqual(new Error('CanvasUtils.drawPeakMeter : Missing arguments canvas or options'));
      expect(CanvasUtils.drawPeakMeter(document.createElement('P'), {})).toEqual(new Error('CanvasUtils.drawPeakMeter : Invalid type for canvas or options'));
      expect(CanvasUtils.drawPeakMeter(canvas, 42)).toEqual(new Error('CanvasUtils.drawPeakMeter : Invalid type for canvas or options'));
      expect(CanvasUtils.drawPeakMeter(canvas, {})).toEqual(new Error('CanvasUtils.drawPeakMeter : Missing arguments options.orientation or options.amplitude or options.peak or options.top'));
      done();
    });
  });
});
