export interface User {
  id: string
  email: string
  name?: string
}

export interface Invoice {
  id: string
  number: string
  amount: number
  status: string
}

export interface Client {
  id: string
  name: string
  email: string
}