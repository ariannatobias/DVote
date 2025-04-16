# DVote
A Web3-Based Voting Framework with zk-SNARK Privacy on Ethereum


## DVote Project Timeline

This Gantt chart outlines our 3-week development plan for **DVote: A Web3-Based Voting Framework with zk-SNARK Privacy on Ethereum**, based on project requirements, rubric criteria, and instructor feedback.

```mermaid

gantt
    title DVote Project Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d
    excludes    weekends

    section Preparation & Research
    Background Research + Literature Review   :pre1, 2025-04-07, 5d
    Project Planning + Spec Draft             :pre2, 2025-04-10, 4d

    section Setup & Architecture
    GitHub Repo Created + Initial Commit      :a1, 2025-04-16, 1d
    Define Architecture + Roles               :a2, 2025-04-16, 2d
    Dev Environment Finalized (Hardhat/React) :a3, 2025-04-17, 1d

    section Smart Contracts
    Voting Logic + Role Access Control        :b1, 2025-04-18, 2d
    zk-SNARK Integration Begins               :b2, 2025-04-20, 3d
    Anti-Sybil + Identity Logic               :b3, 2025-04-22, 2d

    section Frontend & Integration
    Web3.js + Contract Integration            :c1, 2025-04-24, 2d
    UI for Voting + Tallying                  :c2, 2025-04-26, 2d

    section Testing & Optimization
    Contract + UI Testing                     :d1, 2025-04-28, 2d
    zk-SNARK + Gas Benchmarking               :d2, 2025-04-30, 2d
    Fixes & Optimizations                     :d3, 2025-05-01, 1d
    Deploy to Testnet                         :d4, 2025-05-02, 1d

    section Finalization & Submission
    GitHub Cleanup + README                   :e1, 2025-05-02, 1d
    Final Report Writing                      :e2, 2025-04-29, 4d
    Demo Video Recording                      :e3, 2025-05-02, 2d
    Final Review + Submit                     :e4, 2025-05-04, 1d
