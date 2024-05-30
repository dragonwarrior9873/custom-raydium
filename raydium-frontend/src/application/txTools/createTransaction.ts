import { InnerSimpleTransaction } from '@raydium-io/raydium-sdk'
import { Transaction, TransactionInstruction } from '@solana/web3.js'

import { TransactionQueue } from './handleTx'

export type TransactionPiecesCollector = {
  /** @deprecated */
  setRawTransaction: (rawTransaction: Transaction) => void
  /** @deprecated */
  addInstruction: (...instructions: TransactionInstruction[]) => void
  /** @deprecated */
  addEndInstruction: (...instructions: TransactionInstruction[]) => void
  addInnerTransactions: (...innerTransactions: InnerSimpleTransaction[]) => void

  /** @deprecated */
  spawnTransaction: () => Transaction
  spawnTransactionQueue: () => TransactionQueue
}

export const createTransactionCollector = (defaultRawTransaction?: Transaction): TransactionPiecesCollector => {
  let innerTransaction: Transaction | null = null

  const frontInstructions: TransactionInstruction[] = []
  const endInstructions: TransactionInstruction[] = []
  const innerTransactions: InnerSimpleTransaction[] = []

  function setRawTransaction(rawTransaction) {
    innerTransaction = rawTransaction
  }
  function addInstruction(...instructions) {
    frontInstructions.push(...instructions)
  }
  function addEndInstruction(...instructions) {
    endInstructions.push(...instructions)
  }
  function addInnerTransactions(...inputTransactions) {
    innerTransactions.push(...inputTransactions)
  }
  function spawnTransaction() {
    const rawTransaction = innerTransaction || (defaultRawTransaction ?? new Transaction())
    if (frontInstructions.length || endInstructions.length) {
      rawTransaction.add(...frontInstructions, ...endInstructions.reverse())
    }
    return rawTransaction
  }
  function spawnTransactionQueue() {
    return frontInstructions.length || endInstructions.length
      ? [...innerTransactions, spawnTransaction()]
      : innerTransactions
  }
  const collector: TransactionPiecesCollector = {
    setRawTransaction,
    addInstruction,
    addEndInstruction,
    addInnerTransactions,
    spawnTransaction,
    spawnTransactionQueue
  }

  return collector
}
