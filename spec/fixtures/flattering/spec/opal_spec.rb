require 'spec_helper'

module OpalSpec
  describe 'owl compiled successfully' do
    it 'and opal code can be executed in the browser' do
      doc = visit('/')
      expect(doc.evaluate_script('1 + 4')).to eq(5)
      expect(doc.evaluate_script('typeof Opal')).to include('object')
      result = doc.evaluate_ruby do
        1 + 5
      end
      expect(result).to eq(6)
    end
  end
end
