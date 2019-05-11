require 'spec_helper'

module OpalSpec
  describe 'owl compiled successfully' do
    it 'and opal code can be executed in the browser' do
      doc = visit('/')
      expect(doc.evaluate_script('1 + 4')).to eq(5)
      expect(doc.evaluate_script('typeof global.Opal')).to include('object')
      expect(doc.evaluate_ruby { 1 + 5 }).to eq(6)
    end
  end
end
