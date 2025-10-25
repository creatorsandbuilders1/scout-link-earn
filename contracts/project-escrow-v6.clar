;; project-escrow-v6.clar
;; The heart of REFERYDO! - V6 with Official Multi-Recipient Pattern
;; Manages project creation, escrow, talent acceptance/decline, and atomic payouts.

;; =====================================================
;; CHANGELOG v6:
;; - ARCHITECTURAL FIX: Uses official map/fold pattern for multi-recipient transfers
;; - Combines with "Talent gets the rest" arithmetic
;; - Combines with Contract Reserve (1 STX) for operational fees
;; - This is the production-tested pattern from official Stacks contracts
;; =====================================================

;; --- Constants and Variables ---

(define-constant ERR-NOT-AUTHORIZED (err u101))
(define-constant ERR-PROJECT-NOT-FOUND (err u102))
(define-constant ERR-WRONG-STATUS (err u103))
(define-constant ERR-FUNDING-FAILED (err u104))
(define-constant ERR-FEE-CALCULATION-ERROR (err u105))

;; Contract operational reserve - 1 STX to cover internal transaction fees
(define-constant CONTRACT-RESERVE u1000000) ;; 1 STX in microSTX

;; Counter for unique project IDs
(define-data-var project-count uint u0)

;; Map to store all project data
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

;; ============================================================================
;; HELPER FUNCTIONS - Official Multi-Recipient Pattern
;; ============================================================================
;; These functions implement the production-tested pattern for atomic
;; multi-recipient transfers from a contract
;; ============================================================================

;; Send a single payment from the contract to a recipient
(define-private (send-payment (recipient { to: principal, ustx: uint }))
  (as-contract (stx-transfer? (get ustx recipient) tx-sender (get to recipient)))
)

;; Check and propagate errors through the fold
(define-private (check-err (result (response bool uint)) (prior (response bool uint)))
  (match prior 
    ok-value result
    err-value (err err-value)
  )
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
;; APPROVE AND DISTRIBUTE FUNCTION - V6 FINAL ARCHITECTURE
;; ============================================================================
;; Uses official map/fold pattern for atomic multi-recipient transfers
;; Combined with "Talent gets the rest" arithmetic and Contract Reserve
;; ============================================================================
(define-public (approve-and-distribute (project-id uint))
  (let
    (
      (project (unwrap! (map-get? projects project-id) ERR-PROJECT-NOT-FOUND))
      
      ;; --- SAFE ARITHMETIC WITH CONTRACT RESERVE ---
      (total-amount (get amount project))
      
      ;; Reserve 1 STX for operational fees
      (distributable-amount (- total-amount CONTRACT-RESERVE))
      
      ;; Calculate fees on distributable amount
      (scout-payout (/ (* distributable-amount (get scout-fee-percent project)) u100))
      (platform-payout (/ (* distributable-amount (get platform-fee-percent project)) u100))
      (total-fees (+ scout-payout platform-payout))
      
      ;; Talent gets the rest
      (talent-payout (- distributable-amount total-fees))
      
      ;; Create the list of recipients for the multi-send pattern
      (recipients (list
        { to: (get talent project), ustx: talent-payout }
        { to: (get scout project), ustx: scout-payout }
        { to: contract-caller, ustx: platform-payout }
      ))
    )
    
    ;; Authorization check: only the client can approve
    (asserts! (is-eq tx-sender (get client project)) ERR-NOT-AUTHORIZED)
    
    ;; Status check: project must be in "Funded" state
    (asserts! (is-eq (get status project) u1) ERR-WRONG-STATUS)
    
    ;; Safety checks
    (asserts! (> total-amount CONTRACT-RESERVE) ERR-FEE-CALCULATION-ERROR)
    (asserts! (<= total-fees distributable-amount) ERR-FEE-CALCULATION-ERROR)
    
    ;; Use the robust map/fold pattern for atomic multi-recipient transfers
    ;; This is the official, production-tested pattern
    (try! (fold check-err (map send-payment recipients) (ok true)))
    
    ;; Update status to "Completed"
    (map-set projects project-id (merge project {status: u2}))
    (ok true)
  )
)

;; --- Read-Only Functions ---

;; Gets the data for a specific project.
(define-read-only (get-project-data (project-id uint))
  (map-get? projects project-id)
)
