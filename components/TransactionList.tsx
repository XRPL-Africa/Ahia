import type { Transaction } from "../types";

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="fade-in delay-4">
      <div className="section-header">
        <h2 className="section-title">Recent Transactions</h2>
        <button className="see-all">Full History →</button>
      </div>

      <div className="tx-list">
        {transactions.map((tx) => (
          <div key={tx.id} className="tx-row">
            <div className="tx-icon" style={{ background: tx.iconBg }}>
              {tx.iconEmoji}
            </div>
            <div className="tx-body">
              <div className="tx-name">{tx.name}</div>
              <div className="tx-meta">{tx.meta}</div>
            </div>
            <div className="tx-amount">
              <div className={`value ${tx.valueClass}`}>{tx.valueText}</div>
              <div className="fiat">{tx.fiatText}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
