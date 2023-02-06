import { Math as MathDll, AutoformatMath as AutoformatMathDll } from '../src';
import Math from '../src/math';
import AutoformatMath from '../src/autoformatmath';

describe( 'CKEditor5 Math DLL', () => {
	it( 'exports Math', () => {
		expect( MathDll ).to.equal( Math );
	} );

	it( 'exports AutoformatMath', () => {
		expect( AutoformatMathDll ).to.equal( AutoformatMath );
	} );
} );
