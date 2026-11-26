import { runRuleTest } from '#src/__fixtures__/run-rule-test.ts'

import { functionStyle } from './function-style.ts'

runRuleTest('function-style', functionStyle, {
  invalid: [
    {
      code: 'export const Card = () => <article />',
      errors: [{ message: 'Declare this named JSX component with the function keyword.' }],
      filename: 'card.jsx',
      name: 'reports a named arrow component once',
    },
    {
      code: 'const Card = function Card() { return <article /> }',
      errors: [{ message: 'Declare this named JSX component with the function keyword.' }],
      filename: 'card.tsx',
      name: 'reports a named function expression component once',
    },
    {
      code: 'const Blank = (): JSX.Element | null => null',
      errors: 1,
      filename: 'blank.tsx',
      name: 'requires a declaration for a component returning null',
    },
    {
      code: 'const Card = (({ found }) => found ? <><article /></> : null) satisfies Widget',
      errors: 1,
      filename: 'card.tsx',
      name: 'reports a fragment and conditional through a TypeScript wrapper',
    },
    {
      code: 'const Card = React.memo(() => <article />)',
      errors: [{ message: 'Use a function expression for this inline JSX component.' }],
      filename: 'card.jsx',
      name: 'preserves the inline React wrapper style',
    },
    {
      code: 'const Card = UI.wrap(() => <article />)',
      errors: 1,
      filename: 'card.tsx',
      name: 'recognizes a configured member wrapper',
      settings: { react: { componentWrapperFunctions: [{ object: 'UI', property: 'wrap' }] } },
    },
    {
      code: 'export default () => <article />',
      errors: 1,
      filename: 'entry.jsx',
      name: 'preserves inline default export component style',
    },
    {
      code: 'function format(name: string) { return name.trim() }',
      errors: [{ message: 'Bind this ordinary function as an expression.' }],
      filename: 'format.tsx',
      name: 'reports a normal helper declaration in a JSX file',
    },
    {
      code: 'export function Parse(text: string) { return Number(text) }',
      errors: 1,
      filename: 'numbers.tsx',
      name: 'an uppercase helper returning a value is still ordinary',
    },
    {
      code: 'function Factory() { const Item = function Item() { return <div /> }; return Item }',
      errors: 2,
      filename: 'builders.tsx',
      name: 'keeps JSX returns scoped to the function that returns them',
    },
    {
      code: '/** @jsxImportSource preact */\nconst Panel = () => <section />',
      errors: 1,
      filename: 'preact-panel.tsx',
      name: 'checks JSX with the Preact runtime',
    },
    {
      code: '/** @jsxImportSource solid-js */\nconst Panel = () => <section />',
      errors: 1,
      filename: 'solid-panel.tsx',
      name: 'checks JSX with the Solid runtime',
    },
  ],
  valid: [
    {
      code: 'export function Card() { return <article /> }',
      filename: 'card.tsx',
      name: 'accepts a named component declaration',
    },
    {
      code: 'function Blank() { return null }',
      filename: 'blank.tsx',
      name: 'accepts a declared empty component',
    },
    {
      code: 'function Panel({ present }) { const view = <section />; return present && view }',
      filename: 'panel.tsx',
      name: 'recognizes a conditional return of a JSX binding',
    },
    {
      code: 'function Card() { return React.createElement("article") }',
      filename: 'card.jsx',
      name: 'accepts a component using the React element factory',
    },
    {
      code: 'const format = (name) => name.trim(); const Parse = function Parse(text) { return Number(text) }',
      filename: 'format.tsx',
      name: 'accepts ordinary expressions with lowercase and uppercase names',
    },
    {
      code: 'const list = items.map((item) => <li>{item.name}</li>); const shelf = { render: () => <div /> }',
      filename: 'list.tsx',
      name: 'preserves ordinary callbacks and object members',
    },
    {
      code: 'const Card = React.memo(function Card() { return <article /> })',
      filename: 'card.tsx',
      name: 'accepts a function expression in a React wrapper',
    },
    {
      code: 'const Card = React.forwardRef(function Card(props, ref) { return <article ref={ref} /> })',
      filename: 'card.tsx',
      name: 'accepts a forwardRef function expression',
    },
    {
      code: 'const Card = wrap(function Card() { return <article /> })',
      filename: 'card.tsx',
      name: 'accepts a function expression in a configured wrapper',
      settings: { react: { componentWrapperFunctions: ['wrap'] } },
    },
    {
      code: 'const build = () => function Item() { return <div /> }',
      filename: 'builders.tsx',
      name: 'accepts an inline component expression returned by a factory',
    },
    {
      code: 'export default function read() { return "text" }',
      filename: 'entry.tsx',
      name: 'preserves the native default-export exception',
    },
    {
      code: 'export function coerce(value: string): number; export function coerce(value: string | number) { return Number(value) }',
      filename: 'numbers.tsx',
      name: 'leaves a TypeScript overload and its implementation intact',
    },
    {
      code: '/** @jsxImportSource preact */\nfunction Panel() { return <section /> }',
      filename: 'preact-panel.tsx',
      name: 'accepts a declaration with the Preact runtime',
    },
    {
      code: '/** @jsxImportSource solid-js */\nfunction Panel() { return <section /> }',
      filename: 'solid-panel.tsx',
      name: 'accepts a declaration with the Solid runtime',
    },
  ],
})
