require 'spec_helper'

module OpalSpec
  describe 'owl compiled successfully' do
    before :all do
      reset_session!
    end

    it 'and opal code can be executed in the browser' do
      doc = visit('/')
      expect(doc.evaluate('typeof global.Opal')).to include('object')
      expect(doc.evaluate_ruby { 1 + 5 }).to eq(6)
    end
  end
end
