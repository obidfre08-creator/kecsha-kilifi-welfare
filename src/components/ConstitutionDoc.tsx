import React from 'react';

export const ConstitutionDoc: React.FC = () => {
  return (
    <div className="constit rv">
      <nav>
        <b>Contents</b>
        <a href="#p1">I · Preliminary</a>
        <a href="#p2">II · Objectives</a>
        <a href="#p3">III · Membership</a>
        <a href="#p4">IV · Beneficiary Nomination</a>
        <a href="#p5">V · Contributions</a>
        <a href="#p6">VI · Death Benefit</a>
        <a href="#p7">VII · Emergency Assistance</a>
        <a href="#p8">VIII · Governance & Officers</a>
        <a href="#p9">IX · Meetings</a>
        <a href="#p10">X · Financial Management</a>
        <a href="#p11">XI · Approval & Authority Flow</a>
        <a href="#p12">XII · Conduct & Privacy</a>
        <a href="#p13">XIII · Amendments</a>
        <a href="#p14">XIV · Dissolution</a>
        <a href="#sch">Schedule 1</a>
      </nav>

      <div className="doc">
        <div className="chead">
          <h3>CONSTITUTION OF THE KILIFI COUNTY KECSHA WELFARE ASSOCIATION</h3>
          <p>
            DRAFT — for adoption by the Annual General Meeting · Welfare fund of head teachers of Kilifi County
          </p>
        </div>

        <div className="part" id="p1">
          <h4>Part I — Preliminary</h4>
          <div className="art">
            <h5>Article 1 — Name</h5>
            <ol>
              <li>The Association shall be known as the <b>Kilifi County KECSHA Welfare Association</b> (hereinafter “the Association”).</li>
              <li>The registered office of the Association shall be within Kilifi County, Kenya.</li>
            </ol>
          </div>
          <div className="art">
            <h5>Article 2 — Interpretation</h5>
            <ol>
              <li>“Member” means a serving head teacher admitted under Article 4.</li>
              <li>“Beneficiary” means the person nominated in writing by a member under Article 7.</li>
              <li>“The Fund” means all contributions, donations and income of the Association.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p2">
          <h4>Part II — Objectives</h4>
          <div className="art">
            <h5>Article 3 — Objectives</h5>
            <ol>
              <li>To support members and their written beneficiaries upon the death of a member.</li>
              <li>To pool monthly contributions for the common welfare of members.</li>
              <li>To provide emergency assistance to members in documented need.</li>
              <li>To promote unity, dignity and mutual responsibility among head teachers of Kilifi County.</li>
              <li>To manage all funds transparently, accountably and strictly for welfare purposes.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p3">
          <h4>Part III — Membership</h4>
          <div className="art">
            <h5>Article 4 — Eligibility & Admission</h5>
            <ol>
              <li>Membership is open to every serving head teacher of a school within Kilifi County.</li>
              <li>
                Application shall be made through the registration portal, accompanied by: a passport photograph measuring <b>35 × 45 mm</b>, the <b>TSC number</b>, the <b>national ID number</b>, a <b>scanned copy of the national ID</b>, the school and position applied for, next-of-kin particulars, and the applicant's chosen <b>username and password</b>.
              </li>
              <li>
                The <b>System Administrator approves and activates the Chairperson</b>; the <b>Chairperson approves the Secretary, the Treasurer and all other members</b>. Admission is completed upon approval and the first receipted contribution.
              </li>
            </ol>
          </div>
          <div className="art">
            <h5>Article 5 — Cessation</h5>
            <ol>
              <li>Membership ceases on: (a) written resignation; (b) death; (c) ceasing to serve as a head teacher in Kilifi County; (d) removal for gross misconduct; or (e) arrears exceeding six months after written notice.</li>
              <li>Upon death, entitlement passes to the written beneficiary under Article 9.</li>
              <li>Contributions are not refundable, except as the members may resolve in a special case.</li>
            </ol>
          </div>
          <div className="art">
            <h5>Article 6 — Rights & Obligations</h5>
            <ol>
              <li>Every member — including the Chairperson, Secretary and Treasurer — may attend, speak and vote at general meetings, pay contributions and claim benefits.</li>
              <li>Every member shall pay the monthly contribution with payment evidence, keep records, photograph, beneficiary and next-of-kin details accurate, and report discrepancies promptly.</li>
              <li>Members shall protect their login credentials; use of another person's credentials is misconduct.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p4">
          <h4>Part IV — Beneficiary Nomination</h4>
          <div className="art">
            <h5>Article 7 — Written Beneficiary</h5>
            <ol>
              <li>Every member shall nominate in writing the beneficiary who shall receive the death benefit, providing the beneficiary's <b>name, national ID number, relationship</b> (spouse, son, daughter, brother, sister, mother, father or other)<b>, phone number and a 35 × 45 mm photograph</b>.</li>
              <li>A member may change the beneficiary at any time through the Secretary; the change takes effect when verified and recorded.</li>
              <li>Where no valid nomination exists, the benefit shall be paid in this order: surviving spouse; the member's children equally; the member's estate.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p5">
          <h4>Part V — Contributions</h4>
          <div className="art">
            <h5>Article 8 — Monthly Contribution</h5>
            <ol>
              <li>The minimum contribution shall be <b>KSh 1,000 per month</b> per member. A member may contribute more.</li>
              <li>Contributions are due by the 5th day of the month following the month of contribution.</li>
              <li>Each member payment shall be submitted with <b>payment evidence — an M-PESA screenshot or a scanned bank receipt</b> — and is counted once verified: by the Treasurer for ordinary members, and by the Chairperson's countersignature for the Treasurer's own payments.</li>
              <li>An increase of the minimum contribution requires a resolution of a general meeting.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p6">
          <h4>Part VI — Death Benefit</h4>
          <div className="art">
            <h5>Article 9 — Benefit on Death</h5>
            <ol>
              <li>On the death of a member in good standing, the written beneficiary shall receive the amount <b>approved and agreed upon by the members</b> (currently KSh 150,000 per Schedule 1), subject to the Fund's ability to pay as resolved by the members.</li>
              <li>A claim shall be lodged with the Secretary within ninety (90) days and supported by: the death certificate, burial permit, beneficiary's national ID, and a letter from the area administrator.</li>
              <li>Once documents are complete and approval granted under Article 18, payment shall be made to the beneficiary within twenty-one (21) days.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p7">
          <h4>Part VII — Emergency Assistance</h4>
          <div className="art">
            <h5>Article 10 — Emergencies</h5>
            <ol>
              <li>Recognised emergencies include hospitalisation of a member, fire or disaster affecting a member, and bereavement of a member's immediate family.</li>
              <li>Assistance shall not exceed the cap in Schedule 1 (currently KSh 30,000) unless a general meeting resolves otherwise.</li>
              <li>The member, the next of kin, or a representative shall notify the Secretary and submit supporting documents within fourteen (14) days.</li>
              <li>Emergency assistance is a benefit, not a loan, unless the members expressly resolve otherwise.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p8">
          <h4>Part VIII — Governance & Officers</h4>
          <div className="art">
            <h5>Article 11 — Organs</h5>
            <ol>
              <li>The organs of the Association are the General Meeting of members and the office-bearers.</li>
            </ol>
          </div>
          <div className="art">
            <h5>Article 12 — Office-Bearers & System Roles</h5>
            <ol>
              <li><b>System Administrator</b> — custodian of system access and branding; <b>approves and activates the Chairperson</b> after the Chairperson registers like any other member; issues and resets credentials; changes the administrator password after first login.</li>
              <li><b>Chairperson</b> — registers through the member registration portal, is approved and activated by the Administrator, and thereafter <b>approves the Secretary, the Treasurer and all members</b>; presides at meetings; approves welfare payments under Article 18; countersigns the Treasurer's own contributions.</li>
              <li><b>Secretary</b> — documents registrations and records (TSC number, ID, photographs, scanned ID), keeps member records, beneficiary nominations, case documentation, meetings, minutes and communications.</li>
              <li><b>Treasurer</b> — verifies member contribution evidence, records contributions, verifies payments, keeps receipts and statements, processes authorised welfare payments, and prepares financial reports.</li>
              <li>No person shall hold more than one of the offices of Chairperson, Secretary or Treasurer.</li>
            </ol>
          </div>
          <div className="art">
            <h5>Article 13 — Vacation & Removal of Office</h5>
            <ol>
              <li>An office-bearer vacates office on resignation, death, incapacity, or removal by a two-thirds majority of members present at a general meeting for misconduct or breach of this Constitution.</li>
              <li>On vacation, all records, credentials and funds in the officer's custody shall be handed over within fourteen (14) days, and their system credentials revoked or reissued.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p9">
          <h4>Part IX — Meetings</h4>
          <div className="art">
            <h5>Article 14 — General Meetings</h5>
            <ol>
              <li>The AGM shall be held by November each year: to receive reports and audited accounts, set benefits and contributions, and elect office-bearers when due.</li>
              <li>Quarterly general meetings shall be held to review welfare cases and contributions.</li>
              <li>Quorum shall be one-third of active members.</li>
              <li>The Secretary shall record minutes and resolutions; minutes adopted at a meeting form the Association's official record.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p10">
          <h4>Part X — Financial Management</h4>
          <div className="art">
            <h5>Article 15 — Funds & Accounts</h5>
            <ol>
              <li>The Fund shall be held in a bank account and/or designated mobile-money paybill in the Association's name.</li>
              <li>Mandate signatories shall be the Chairperson and the Treasurer, with the Secretary as an alternative signatory as resolved.</li>
            </ol>
          </div>
          <div className="art">
            <h5>Article 16 — Separation of Duties & Integrity of Records</h5>
            <ol>
              <li>The duties of recording, approving and paying shall be separated among officers as set out in this Constitution.</li>
              <li><b>No officer shall secretly alter, delete or reverse historical financial records.</b> Any correction shall be made as a visible adjusting entry by the Treasurer, stating reason, and shall appear in the audit trail.</li>
              <li>The Chairperson may review financial records but may not modify them. The Secretary may view payment status but may not alter financial records.</li>
              <li>The Treasurer shall not verify or approve their own payments; the Treasurer's own contributions and benefits require the Chairperson's countersignature, recorded in the audit trail.</li>
            </ol>
          </div>
          <div className="art">
            <h5>Article 17 — Audit</h5>
            <ol>
              <li>The accounts shall be examined annually by an auditor or inspection committee appointed at the AGM.</li>
              <li>Members may inspect the financial statement at the AGM and may raise discrepancies in writing.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p11">
          <h4>Part XI — Approval & Authority Flow</h4>
          <div className="art">
            <h5>Article 18 — Welfare Payment Chain</h5>
            <ol>
              <li>Every welfare payment shall follow the chain: <b>notification → documentation by the Secretary → verification of eligibility and funds by the Treasurer → approval by the Chairperson → payment and confirmation by the Treasurer.</b></li>
              <li>In life-threatening emergencies the Chairperson, with any two office-bearers, may authorise fast-track assistance, which must be ratified at the next meeting.</li>
              <li>Every step shall be time-stamped in the system's audit trail.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p12">
          <h4>Part XII — Conduct & Privacy</h4>
          <div className="art">
            <h5>Article 19</h5>
            <ol>
              <li>Officers and members shall act in good faith and protect the dignity of beneficiaries and affected members.</li>
              <li>Case files, photographs, ID scans, payment evidence, credentials, medical information and beneficiary details are confidential and shall be processed only for welfare purposes, in accordance with Kenya's data protection law.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p13">
          <h4>Part XIII — Amendments</h4>
          <div className="art">
            <h5>Article 20</h5>
            <ol>
              <li>This Constitution may be amended by a two-thirds majority of members present at an AGM or a special meeting convened for that purpose.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="p14">
          <h4>Part XIV — Dissolution</h4>
          <div className="art">
            <h5>Article 21</h5>
            <ol>
              <li>Dissolution requires a two-thirds majority of all active members.</li>
              <li>After settling all pending benefits, any surplus shall be donated to a charitable cause serving schools in Kilifi County, as resolved at the dissolution meeting.</li>
            </ol>
          </div>
        </div>

        <div className="part" id="sch">
          <h4>Schedule 1 — Contributions, Benefits & Documents</h4>
          <div className="twrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Amount / Rule</th>
                  <th>Authority</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Minimum monthly contribution</td>
                  <td className="mono">KSh 1,000</td>
                  <td>Article 8</td>
                </tr>
                <tr>
                  <td>Contribution evidence</td>
                  <td>M-PESA screenshot or scanned bank receipt, verified by Treasurer (Chairperson countersigns Treasurer's own)</td>
                  <td>Article 8(3)</td>
                </tr>
                <tr>
                  <td>Death benefit (to written beneficiary)</td>
                  <td className="mono">KSh 150,000</td>
                  <td>AGM resolution</td>
                </tr>
                <tr>
                  <td>Emergency assistance cap</td>
                  <td className="mono">KSh 30,000</td>
                  <td>Article 10</td>
                </tr>
                <tr>
                  <td>Member & beneficiary photograph</td>
                  <td>35 × 45 mm, plain background</td>
                  <td>Articles 4(2) & 7(1)</td>
                </tr>
                <tr>
                  <td>Registration documents</td>
                  <td>TSC · ID · scanned ID · next of kin · username & password</td>
                  <td>Article 4(2)</td>
                </tr>
                <tr>
                  <td>Contribution due date</td>
                  <td>5th of the following month</td>
                  <td>Article 8(2)</td>
                </tr>
                <tr>
                  <td>Payment window after approval</td>
                  <td>21 days</td>
                  <td>Article 9(3)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
