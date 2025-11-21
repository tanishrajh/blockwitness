// frontend/src/pages/Timeline.jsx
import React, { useEffect, useState } from "react";
import { getTimeline } from "../api";

export default function Timeline() {
  const [blocks, setBlocks] = useState([]);

  useEffect(()=>{ load(); }, []);

  async function load() {
    try {
      const res = await getTimeline();
      setBlocks(res);
    } catch(err) {
      alert("Failed to load timeline: " + err.message);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Chain Timeline</h1>
      <div className="space-y-4">
        {blocks.map(b => (
          <div key={b.idx} className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">Block #{b.idx}</div>
                <div className="text-xs text-gray-600">{b.timestamp}</div>
                <div className="text-xs text-gray-600">Hash: {b.block_hash?.slice(0,12)}...</div>
              </div>
              <div className="text-sm text-gray-700">Transactions: {b.transactions.length}</div>
            </div>

            <div className="mt-3">
              <ul className="ml-4 list-disc text-sm">
                {b.transactions.map(tx => (
                  <li key={tx.tx_id}><b>{tx.title}</b> — {tx.uploader} — <span className="text-xs text-gray-500">{tx.tx_id}</span></li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
