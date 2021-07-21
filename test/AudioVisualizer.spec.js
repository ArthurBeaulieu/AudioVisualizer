import AudioVisualizer from '../src/js/AudioVisualizer.js';
import ColorUtils from '../src/js/utils/ColorUtils.js';

describe('AudioVisualizer unit test -', () => {
	describe('ColorUtils unit test -', () => {
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
			done();
		});	

		it('ColorUtils.alphaColor standard behavior', done => {
			expect(ColorUtils.alphaColor('FF0000', 0)).toEqual('rgba(255, 0, 0, 0)');
			expect(ColorUtils.alphaColor('FF0000', 0.5)).toEqual('rgba(255, 0, 0, 0.5)');
			expect(ColorUtils.alphaColor('0000FF', 1)).toEqual('rgba(0, 0, 255, 1)');
			expect(ColorUtils.alphaColor('00FF00', 1)).toEqual('rgba(0, 255, 0, 1)');
			expect(ColorUtils.alphaColor('FF0000', 1)).toEqual('rgba(255, 0, 0, 1)');
			expect(ColorUtils.alphaColor('#FF0000', 1)).toEqual('rgba(255, 0, 0, 1)');
			expect(ColorUtils.alphaColor('FFFFFF', -42)).toEqual('rgba(255, 255, 255, 0)');
			expect(ColorUtils.alphaColor('FFFFFF', 42)).toEqual('rgba(255, 255, 255, 1)');
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
			done();
		});

		it('ColorUtils.lightenDarkenColor standard behavior', done => {
			expect(ColorUtils.lightenDarkenColor('FF0000', 0)).toEqual('ff0000');
			expect(ColorUtils.lightenDarkenColor('000000', 10)).toEqual('1a1a1a');
			expect(ColorUtils.lightenDarkenColor('000000', 25)).toEqual('292929');
			expect(ColorUtils.lightenDarkenColor('000000', 50)).toEqual('424242');
			expect(ColorUtils.lightenDarkenColor('000000', 100)).toEqual('747474');
			expect(ColorUtils.lightenDarkenColor('000000', 9999)).toEqual('747474');
			expect(ColorUtils.lightenDarkenColor('FFFFFF', -10)).toEqual('e5e5e5');
			expect(ColorUtils.lightenDarkenColor('FFFFFF', -25)).toEqual('d6d6d6');
			expect(ColorUtils.lightenDarkenColor('FFFFFF', -50)).toEqual('bdbdbd');
			expect(ColorUtils.lightenDarkenColor('FFFFFF', -100)).toEqual('8b8b8b');
			expect(ColorUtils.lightenDarkenColor('FFFFFF', -9999)).toEqual('8b8b8b');
			done();
		});

		it('ColorUtils.rainbowLinearGradient error handling', done => {
			expect(ColorUtils.rainbowLinearGradient()).toEqual(new Error('ColorUtils.rainbowLinearGradient : Missing arguments canvas'));
			expect(ColorUtils.rainbowLinearGradient([])).toEqual(new Error('ColorUtils.rainbowLinearGradient : Invalid type for canvas or vertical'));
			expect(ColorUtils.rainbowLinearGradient(document.createElement('CANVAS'), {})).toEqual(new Error('ColorUtils.rainbowLinearGradient : Invalid type for canvas or vertical'));
			done();
		});	

		it('ColorUtils.rainbowLinearGradient standard behavior', done => {
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
			ColorUtils.rainbowLinearGradient(document.createElement('CANVAS'));
			ColorUtils.rainbowLinearGradient(document.createElement('CANVAS'), true);
		});				
	});
});
