// frontend/src/pages/Explorer.jsx
import React, { useEffect, useState } from "react";
import { explorer, getBlock, getBlockQr, getMerkleProof, downloadCertificate, verifyChain } from "../api";
import MerkleVisualizer from "../components/MerkleVisualizer";

export default function Explorer() {
  const [blocks, setBlocks] = useState([]);
  const [detail, setDetail] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [selectedLeaf, setSelectedLeaf] = useState("");
  const [proofData, setProofData] = useState(null);
  const [showMerkle, setShowMerkle] = useState(false);
  const [chainStatus, setChainStatus] = useState(null);

  useEffect(()=>{ loadBlocks(); }, []);

  async function loadBlocks(){
    try {
      const data = await explorer();
      setBlocks(data);
    } catch(err) {
      alert("Failed to load blocks: " + err.message);
    }
  }

  async function openBlock(idx){
    try {
      const d = await getBlock(idx);
      setDetail(d);
      setQrData(null);
      setProofData(null);
      setShowMerkle(false);
      // default select first evidence hash if present
    } catch(err) {
      alert("Failed to open block: " + err.message);
    }
  }

  async function showQr(idx){
    try {
      const r = await getBlockQr(idx);
      setQrData(r);
    } catch(err) {
      alert("Failed to fetch QR: " + err.message);
    }
  }

  async function fetchMerkle(idx, leaf){
    try {
      const res = await getMerkleProof(idx, leaf);
      setProofData(res);
      setShowMerkle(true);
    } catch(err){
      alert("Failed to fetch merkle proof: " + err.message);
    }
  }

  async function downloadCert(reportId) {
    try {
      const blob = await downloadCertificate(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Certificate download failed: " + err.message);
    }
  }

  async function checkChain() {
    try {
      const res = await verifyChain();
      setChainStatus(res);
      if (!res.ok) {
        alert("Chain problems found; open console for details");
        console.log(res.problems);
      } else {
        alert("Chain OK — no problems detected");
      }
    } catch(err) {
      alert("Chain verify failed: " + err.message);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Block Explorer</h1>
        <div className="flex gap-2">
          <button onClick={checkChain} className="px-3 py-2 bg-amber-600 text-white rounded">Verify Chain</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          {blocks.map(b => (
            <div key={b.idx} className="p-3 bg-white rounded shadow mb-2">
              <div className="font-semibold">Block #{b.idx}</div>
              <div className="text-xs text-gray-600">Root: {b.merkle_root?.slice(0,12)}...</div>
              <div className="mt-2 flex gap-2">
                <button onClick={()=>openBlock(b.idx)} className="text-indigo-600 underline">View</button>
                <button onClick={()=>showQr(b.idx)} className="text-green-600 underline">Show QR</button>
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-2">
          {detail ? (
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-bold">Block #{detail.idx}</h2>
              <div className="mt-2"><strong>Timestamp:</strong> {detail.timestamp}</div>
              <div><strong>Block Hash:</strong> {detail.block_hash}</div>
              <div><strong>Previous Hash:</strong> {detail.previous_hash}</div>
              <div><strong>Merkle Root:</strong> {detail.merkle_root}</div>

              <h3 className="mt-4 font-semibold">Transactions</h3>
              <div className="space-y-3">
                {detail.transactions.map(tx => (
                  <div key={tx.tx_id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{tx.title}</div>
                        <div className="text-xs text-gray-600">Uploader: {tx.uploader}</div>
                        <div className="text-xs text-gray-600">Report: {tx.report_id}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => downloadCert(tx.report_id)} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm">Download PDF</button>
                        <button onClick={() => {
                          // try first evidence hash from saved report JSON
                          const rp = tx.report_id;
                          fetch(`/api/`) // no-op to hint
                        }} className="px-2 py-1 bg-gray-200 rounded text-sm">Preview</button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm text-gray-700">Evidence:</div>
                      <ul className="list-disc ml-6">
                        {(() => {
                          // attempt to read saved report JSON via the frontend by requesting /api/block/<idx> which includes transactions
                          // but we already have tx.report_id here
                          const repPath = `/api/report/${tx.report_id}/certificate`; // not used, just for info
                          return (tx._evidence || []).length ? tx._evidence.map(e => <li key={e.filename}>{e.filename}</li>) : <li className="text-xs text-gray-500">(open report JSON file in uploads folder)</li>
                        })()}
                      </ul>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input placeholder="paste leaf hash or leave empty" value={selectedLeaf} onChange={(e)=>setSelectedLeaf(e.target.value)} className="px-3 py-1 border rounded" />
                      <button onClick={()=>fetchMerkle(detail.idx, selectedLeaf)} className="px-3 py-1 bg-green-600 text-white rounded">Get Merkle Proof</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-semibold">QR Verification</h4>
                <div className="mt-2">
                  {qrData && (
                    <div className="p-3 bg-gray-50 rounded inline-block">
                      <img alt="qr" src={`data:image/png;base64,${qrData.qr_base64}`} />
                      <div className="text-xs text-gray-600 mt-2">
                        Or open: <a className="text-indigo-600" href={qrData.verification_url} target="_blank" rel="noreferrer">{qrData.verification_url}</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : <div className="text-gray-600">Select a block to view details</div>}
        </div>
      </div>

      {showMerkle && proofData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded max-w-2xl w-full">
            <h3 className="text-xl font-semibold mb-2">Merkle proof for leaf</h3>
            <div className="mb-2">Leaf: <code className="bg-gray-100 px-2 py-1 rounded">{proofData.leaf}</code></div>
            <MerkleVisualizer proof={proofData.proof} leaf={proofData.leaf} root={proofData.root} valid={proofData.valid} />
            <div className="mt-4 text-right">
              <button onClick={()=>{ setShowMerkle(false); setProofData(null); }} className="px-3 py-2 bg-gray-300 rounded">Close</button>
            </div>
          </div>
        </div>
      )}

      {chainStatus && (
        <div className="mt-6 bg-yellow-50 p-3 rounded">
          <div className="font-semibold">Chain Verify Result</div>
          <pre className="text-sm">{JSON.stringify(chainStatus, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
