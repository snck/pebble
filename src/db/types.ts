export interface Expense {
  id: string
  /** Integer, in minor units (e.g. cents/satang). */
  amount: number
  categoryId: string
  /** Local calendar date, YYYY-MM-DD. */
  date: string
  note?: string
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  name: string
  emoji?: string
  /** Fixed costs are excluded from the report by default. */
  isFixed: boolean
  order: number
  /** Archive instead of delete so old expenses keep their category. */
  archived: boolean
}

export interface NoSpendDay {
  /** YYYY-MM-DD, primary key. */
  date: string
}

export interface Settings {
  /** ISO 4217 code. */
  currency: string
}

/** The editable fields of an expense. */
export interface ExpenseInput {
  amount: number
  categoryId: string
  date: string
  note?: string
}

/** The editable fields of a category. */
export interface CategoryInput {
  name: string
  emoji?: string
  isFixed: boolean
}
