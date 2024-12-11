import { ethers } from 'ethers';

export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  handleApprove,
  approved, 
}) {
  return (
    <div className={`existing-contract ${approved ? 'complete' : ''}`}>
      <ul className="fields">
        <li>
          <div> Arbiter </div>
          <div> {arbiter} </div>
        </li>
        <li>
          <div> Beneficiary </div>
          <div> {beneficiary} </div>
        </li>
        <li>
          <div> Value </div>
          <div> {value} ETH </div>
        </li>
        {approved ? (
          <div className="complete" id={address}>
            ✓ It's been approved!
          </div>
        ) : (
          <div
            className="button"
            id={address}
            onClick={(e) => {
              e.preventDefault();
              handleApprove();
            }}
          >
            Approve
          </div>
        )}
      </ul>
    </div>
  );
}
