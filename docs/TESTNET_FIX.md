# Testnet Configuration Fix

## Issues Fixed

### 1. Import Error - StacksMainnet
**Problem:** `StacksMainnet` doesn't exist in `@stacks/network` package
**Error:** `The requested module does not provide an export named 'StacksMainnet'`

**Fix:** Removed the incorrect import and used `StacksTestnet` for both configurations
- File: `src/config/contracts.ts`
- Changed: Removed `StacksMainnet` import
- Updated: Mainnet config now uses `StacksTestnet` with mainnet URL (will be updated when contracts are deployed to mainnet)

### 2. Network Mismatch
**Problem:** Wallet was defaulting to Mainnet but contracts are on Testnet
**Impact:** Users couldn't interact with testnet contracts

**Fix:** Changed default network to Testnet
- File: `src/contexts/WalletContext.tsx`
- Changed: `BitcoinNetworkType.Mainnet` → `BitcoinNetworkType.Testnet`

### 3. UI Clarity
**Problem:** Wallet modal said "Mainnet" but we're on Testnet

**Fix:** Updated wallet selection modal text
- File: `src/components/WalletSelectionModal.tsx`
- Changed: Display now shows "Testnet" instead of "Mainnet"

## Current Configuration

### Network: Testnet
All components now default to Stacks Testnet:
- Wallet connections use Testnet
- Contract calls go to Testnet
- Transaction explorer links point to Testnet

### Contract Addresses (Testnet)
- Profile Registry: `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.profile-registry`
- Project Escrow: `ST2ZG3R1EMK0Z83EX4N43HATRFM68JMS01TNGZRPV.project-escrow`

## Testing

The white screen issue should now be resolved. The app will:
1. Load correctly without import errors
2. Connect wallets to Testnet by default
3. Interact with your deployed testnet contracts

## Next Steps

1. **Clear browser cache** and reload
2. **Connect wallet** in Testnet mode
3. **Get testnet STX** from faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet
4. **Test the Scout flow**:
   - Generate referral link
   - Create project
   - Fund escrow
   - Approve and distribute

## When Moving to Mainnet

When you deploy contracts to mainnet, update:
1. `src/config/contracts.ts` - Add mainnet contract addresses
2. `src/contexts/WalletContext.tsx` - Change default to `BitcoinNetworkType.Mainnet`
3. `src/components/WalletSelectionModal.tsx` - Update text to "Mainnet"

---

**The app should now load correctly on Testnet!** 🎉
