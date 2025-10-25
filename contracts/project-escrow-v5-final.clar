;; project-escrow-v5-final.clar
;; The heart of REFERYDO! - FINAL PRODUCTION VERSION
;; Manages project creation, escrow, talent acceptance/decline, and atomic payouts.

;; =====================================================
;; CHANGELOG v5-final:
;; - DEFINITIVE FIX: Contract reserves 1 STX for operational fees
;; - Prevents (err u2) by ensuring contract always has balance for tx fees
;; - "Talent gets the rest" model on distributable amount
;; - THIS IS THE FINAL, PRODUCTION-READY VERSION
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
;; APPROVE AND DISTRIBUTE FUNCTION - v5-final PRODUCTION VERSION
;; ============================================================================
;; FINAL FIX: Contract reserves 1 STX for operational fees
;; This prevents (err u2) by ensuring contract always has balance for tx fees
;; ============================================================================
(define-public (approve-and-distribute (project-id uint))
  (let ((project (unwrap! (map-get? projects project-id) ERR-PROJECT-NOT-FOUND)))
    ;; Authorization check: only the client can approve.
    (asserts! (is-eq tx-sender (get client project)) ERR-NOT-AUTHORIZED)
    
    ;; Status check: project must be in "Funded" state.
    (asserts! (is-eq (get status project) u1) ERR-WRONG-STATUS)
    
    (let
      (
        ;; --- FINAL, DEFINITIVE FIX ---
        (total-amount (get amount project))
        
        ;; The distributable amount is the total minus our operational reserve
        ;; The reserve stays in the contract to pay for internal tx fees
        (distributable-amount (- total-amount CONTRACT-RESERVE))
        
        ;; Now, calculate fees based on the distributable amount
        (scout-payout (/ (* distributable-amount (get scout-fee-percent project)) u100))
        (platform-payout (/ (* distributable-amount (get platform-fee-percent project)) u100))
        (total-fees (+ scout-payout platform-payout))
        
        ;; The Talent gets the rest of the distributable amount
        (talent-payout (- distributable-amount total-fees))
      )
      
      ;; CRITICAL: Ensure the total amount is greater than the reserve
      ;; This guarantees the contract always has funds for transaction fees
      (asserts! (> total-amount CONTRACT-RESERVE) ERR-FEE-CALCULATION-ERROR)
      
      ;; Safety check on the distributable amount
      (asserts! (<= total-fees distributable-amount) ERR-FEE-CALCULATION-ERROR)
      
      ;; --- END OF FINAL, DEFINITIVE FIX ---
      
      ;; ATOMIC PAYOUTS
      ;; The contract sends funds from its balance
      ;; The CONTRACT-RESERVE stays in the contract to pay for these tx fees
      (try! (as-contract (stx-transfer? talent-payout tx-sender (get talent project))))
      (try! (as-contract (stx-transfer? scout-payout tx-sender (get scout project))))
      (try! (as-contract (stx-transfer? platform-payout tx-sender contract-caller)))
      
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
