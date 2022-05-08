import { addPunctuation } from 'shared'

export const greet = (name: string) => `hello ${name}`
export const fancyGreet = (name: string) => addPunctuation(greet(name))
