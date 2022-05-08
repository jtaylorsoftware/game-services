import { expect } from 'chai'
import { fancyGreet, greet } from 'scores'

describe('greetings', () => {
  describe('greet', () => {
    it('says hello', () => {
      expect(greet('world')).to.equal('hello world')
    })
  })
  describe('fancyGreet', () => {
    it('is excited', () => {
      expect(fancyGreet('world')).to.equal('hello world!')
    })
  })
})
