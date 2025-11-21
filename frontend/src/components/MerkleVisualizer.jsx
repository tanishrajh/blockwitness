// frontend/src/components/MerkleVisualizer.jsx
import React, { useMemo } from "react";

/**
 * Props:
 *  - proof: [{ sibling: <hex>, position: 'left'|'right' }, ...]
 *  - leaf: string
 *  - root: string
 *  - valid: boolean
 */
export default function MerkleVisualizer({ proof = [], leaf = "", root = "", valid = false }) {
  const computedRoot = useMemo(() => {
    if (!leaf || !proof) return null;
    let cur = leaf;
    for (const p of proof) {
      const sib = p.sibling;
      if (p.position === "left") {
        cur = window.sha256 ? window.sha256(sib + cur) : null;
      } else {
        cur = window.sha256 ? window.sha256(cur + sib) : null;
      }
      // If window.sha256 not available, we still show proof structure visually
    }
    return cur;
  }, [proof, leaf]);

  return (
    <div>
      <div className="mb-3">
        <strong>Merkle Root (expected):</strong>
        <div className="font-mono bg-gray-100 p-2 rounded mt-1 break-all">{root}</div>
      </div>

      <div className="mb-3">
        <strong>Leaf:</strong>
        <div className="font-mono bg-gray-100 p-2 rounded mt-1 break-all">{leaf}</div>
      </div>

      <div className="mb-3">
        <strong>Proof steps:</strong>
        <ol className="list-decimal ml-6">
          {proof && proof.map((p, i) => (
            <li key={i} className="mb-2">
              <div className="text-sm">Sibling: <span className="font-mono break-all">{p.sibling}</span></div>
              <div className="text-sm">Position: {p.position}</div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4">
        <div>
          <strong>Proof verification:</strong>
          <div className="mt-1">
            {valid ? <span className="text-green-600 font-semibold">VALID — reconstructed root matches</span> : <span className="text-red-600 font-semibold">INVALID — proof does not match root</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
