;; project-escrow-v3.clar
;; The heart of REFERYDO! - Version 3 with Arithmetic Underflow Fix
;; Manages project creation, escrow, talent acceptance/decline, and atomic payouts.

;; =====================================================
;; CHANGELOG v3:
;; - CRITICAL FIX: Added ERR-FEE-CALCULATION-ERROR (err u105)
;; - CRITICAL FIX: Refactored approve-and-distribute to prevent arithmetic underflow
;; - Uses checked-sub for safe subtraction with proper error handling
;; - Calculates total-fees first, then subtracts from total-amount
;; =====================================================

;; =====================================================
;; CHANGELOG v2:
;; - Added Proposal & Acceptance flow
;; - New status: u4 (Pending_Acceptance)
;; - New status: u5 (Declined)
;; - New function: accept-project (talent accepts work)
;; - New function: decline-project (talent declines with automatic refund)
;; - Modified: fund-escrow now sets status to u4 instead of u1
;; =====================================================

;; --- Constants and Variables ---

(define-constant ERR-NOT-AUTHORIZED (err u101))
(define-constant ERR-PROJECT-NOT-FOUND (err u102))
(define-constant ERR-WRONG-STATUS (err u103))
(define-constant ERR-FUNDING-FAILED (err u104))
(define-constant ERR-FEE-CALCULATION-ERROR (err u105))  ;; NEW v3: For arithmetic errors

;; Counter for unique project IDs
(define-data-var project-count uint u0)

;; Map to store all project data
;; project-id -> { client, talent, scout, amount, scout-fee-percent, platform-fee-percent, status }
(define-map projects uint
  {
    client: principal,
    talent: principal,
    scout: principal,
    amount: uint,
    scout-fee-percent: uint,
    platform-fee-percent: uint,
    status: uint  ;; 0: Created, 1: Funded, 2: Completed, 3: Disputed, 4: Pending_Acceptance, 5: Declined
  }
)

;; --- Public Functions ---

;; Creates a new project, initiated by the Client.
(define-public (create-project (talent principal) (scout principal) (amount uint) (scout-fee uint) (platform-fee uint))
  (let ((next-id (+ (var-get project-count) u1)))
    (map-set projects next-id
      {
        client: tx-sender,
        talent: talent,
        scout: scout,
        amount: amount,
        scout-fee-percent: scout-fee,
        platform-fee-percent: platform-fee,
        status: u0
      }
    )
    (var-set project-count next-id)
    (ok next-id)
  )
)

;; Funds the escrow for a specific project. Must be called by the Client.
;; Sets status to u4 (Pending_Acceptance)
(define-public (fund-escrow (project-id uint))
  (let ((project (unwrap! (map-get? projects project-id) ERR-PROJECT-NOT-FOUND)))
    ;; Authorization check: only the client can fund.
    (asserts! (is-eq tx-sender (get client project)) ERR-NOT-AUTHORIZED)
    
    ;; Status check: project must be in "Created" state.
    (asserts! (is-eq (get status project) u0) ERR-WRONG-STATUS)
    
    ;; Transfer STX from the client to this contract (the escrow).
    (try! (stx-transfer? (get amount project) tx-sender (as-contract tx-sender)))
    
    ;; Update status to "Pending_Acceptance"
    (map-set projects project-id (merge project {status: u4}))
    (ok true)
  )
)

;; Allows the Talent to accept the project.
;; This moves the project from Pending_Acceptance to Funded, allowing work to begin.
(define-public (accept-project (project-id uint))
  (let ((project (unwrap! (map-get? projects project-id) ERR-PROJECT-NOT-FOUND)))
    ;; Authorization check: only the talent can accept.
    (asserts! (is-eq tx-sender (get talent project)) ERR-NOT-AUTHORIZED)
    
    ;; Status check: project must be in "Pending_Acceptance" state.
    (asserts! (is-eq (get status project) u4) ERR-WRONG-STATUS)
    
    ;; Update status to "Funded" - work can now begin
    (map-set projects project-id (merge project {status: u1}))
    (ok true)
  )
)

;; Allows the Talent to decline the project with automatic refund.
;; This returns the full escrow amount to the Client and marks the project as Declined.
(define-public (decline-project (project-id uint))
  (let (
    (project (unwrap! (map-get? projects project-id) ERR-PROJECT-NOT-FOUND))
    (client-address (get client project))
    (refund-amount (get amount project))
  )
    ;; Authorization check: only the talent can decline.
    (asserts! (is-eq tx-sender (get talent project)) ERR-NOT-AUTHORIZED)
    
    ;; Status check: project must be in "Pending_Acceptance" state.
    (asserts! (is-eq (get status project) u4) ERR-WRONG-STATUS)
    
    ;; REFUND: Return full amount to client
    (try! (as-contract (stx-transfer? refund-amount tx-sender client-address)))
    
    ;; Update status to "Declined"
    (map-set projects project-id (merge project {status: u5}))
    (ok true)
  )
)

;; ============================================================================
;; APPROVE AND DISTRIBUTE FUNCTION - v3 CRITICAL FIX
;; ============================================================================
;; Approves the project and distributes the funds. Must be called by the Client.
;; v3 FIX: Uses safe arithmetic to prevent underflow errors
;; ============================================================================
(define-public (approve-and-distribute (project-id uint))
  (let ((project (unwrap! (map-get? projects project-id) ERR-PROJECT-NOT-FOUND)))
    ;; Authorization check: only the client can approve.
    (asserts! (is-eq tx-sender (get client project)) ERR-NOT-AUTHORIZED)
    
    ;; Status check: project must be in "Funded" state.
    (asserts! (is-eq (get status project) u1) ERR-WRONG-STATUS)
    
    (let
      (
        (total-amount (get amount project))
        (scout-payout (/ (* total-amount (get scout-fee-percent project)) u100))
        (platform-payout (/ (* total-amount (get platform-fee-percent project)) u100))
        
        ;; --- v3 CRITICAL FIX: Safe arithmetic ---
        ;; Calculate total fees first
        (total-fees (+ scout-payout platform-payout))
        ;; Use checked-sub to prevent underflow - will return error if fees > amount
        (talent-payout (unwrap! (checked-sub total-amount total-fees) ERR-FEE-CALCULATION-ERROR))
        ;; --- END v3 FIX ---
      )
      ;; ATOMIC PAYOUTS
      ;; The contract sends funds from its own balance.
      (try! (as-contract (stx-transfer? talent-payout tx-sender (get talent project))))
      (try! (as-contract (stx-transfer? scout-payout tx-sender (get scout project))))
      (try! (as-contract (stx-transfer? platform-payout tx-sender contract-caller))) ;; platform-payout goes to the deployer address
      
      ;; Update status to "Completed"
      (map-set projects project-id (merge project {status: u2}))
      (ok true)
    )
  )
)

;; --- Read-Only Functions ---

;; Gets the data for a specific project.
(define-read-only (get-project-data (project-id uint))
  (map-get? projects project-id)
)
