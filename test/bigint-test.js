var mocha  = require('mocha')
  , assert = require('chai').assert
  , expect = require('chai').expect
  , Long = require('long')
  , BigNumber = require('bignumber.js')
  ;

describe("Testing bigint support", function(){
    var input = '{"big":9223372036854775807,"bigDecimal":9223372036854775807.1,"small":123}';

    it("Should show classic JSON.parse lacks bigint support", function(done){
        var obj = JSON.parse(input);
        expect(obj.small.toString(), "string from small int").to.equal("123");
        expect(obj.big.toString(), "string from big int").to.not.equal("9223372036854775807");

        var output = JSON.stringify(obj);
        expect(output).to.not.equal(input);
        done();
    });

    it("Should show JSNbig does support bigint parse/stringify roundtrip", function(done){
        var JSONbig = require('../index');
        var obj = JSONbig.parse(input);
        expect(obj.small.toString(), "string from small int").to.equal("123");
        expect(obj.big.toString(), "string from big int").to.equal("9223372036854775807");
        expect(obj.big, "instanceof Long").to.be.instanceof(Long);
        expect(obj.bigDecimal, "instanceof BigNumber").to.be.instanceof(BigNumber);

        var output = JSONbig.stringify(obj);
        expect(output).to.equal(input);
        done();
    });
});
