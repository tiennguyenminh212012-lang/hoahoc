import type { ReactNode } from 'react'

interface FormulaProps {
  formula: string
  charge?: number
  coefficient?: number
  className?: string
  label?: string
}

function renderCore(formula: string): ReactNode[] {
  const parts: ReactNode[] = []
  const normalized = formula.replaceAll('−', '-')
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index]
    if (character === '^') {
      const charge = normalized.slice(index + 1).replace('-', '−')
      parts.push(<sup key={`charge-${index}`}>{charge}</sup>)
      break
    }
    if (character && /\d/.test(character)) {
      let digits = character
      while (index + 1 < normalized.length && /\d/.test(normalized[index + 1] ?? '')) digits += normalized[++index]
      parts.push(<sub key={`sub-${index}`}>{digits}</sub>)
    } else if (character === '+' || character === '-') {
      parts.push(<sup key={`sign-${index}`}>{character === '-' ? '−' : '+'}</sup>)
    } else {
      parts.push(character)
    }
  }
  return parts
}

export function Formula({ formula, charge, coefficient, className, label }: FormulaProps) {
  const chargeText = charge === undefined || charge === 0 ? '' : `${Math.abs(charge) === 1 ? '' : Math.abs(charge)}${charge > 0 ? '+' : '−'}`
  return (
    <span className={`formula ${className ?? ''}`} aria-label={label ?? `${coefficient && coefficient !== 1 ? coefficient : ''}${formula}${chargeText}`}>
      {coefficient && coefficient !== 1 ? <span className="formula-coefficient">{coefficient}</span> : null}
      {renderCore(formula)}
      {chargeText ? <sup>{chargeText}</sup> : null}
    </span>
  )
}
