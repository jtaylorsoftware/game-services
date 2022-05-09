import { expect } from 'chai'
import { isSuccess, Result } from '../src/result.js'

describe('result', () => {
  describe('isSuccess', () => {
    it('returns true for status code eq 200', () => {
      const result: Result<void> = {
        status: 200,
        data: undefined,
      }
      expect(isSuccess(result)).to.be.true
    })
    it('returns true for status code in [200, 300)', () => {
      const result: Result<void> = {
        status: 250,
        data: undefined,
      }
      expect(isSuccess(result)).to.be.true
    })
    it('returns false for status code < 200', () => {
      const result: Result<void> = {
        status: 100,
        data: undefined,
      }
      expect(isSuccess(result)).to.be.false
    })
    it('returns false for status code eq 300', () => {
      const result: Result<void> = {
        status: 300,
        data: undefined,
      }
      expect(isSuccess(result)).to.be.false
    })
    it('returns false for status code > 300', () => {
      const result: Result<void> = {
        status: 401,
        data: undefined,
      }
      expect(isSuccess(result)).to.be.false
    })
  })
})
