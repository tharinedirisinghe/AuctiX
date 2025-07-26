package com.helios.auctix.controllers;

import com.helios.auctix.dtos.RechargeRequestDTO;
import com.helios.auctix.dtos.TransactionResponseDTO;
import com.helios.auctix.dtos.WithdrawRequestDTO;
import com.helios.auctix.services.CoinTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/coins")
public class CoinTransactionController {

    private final CoinTransactionService transactionService;

    @Autowired
    public CoinTransactionController(CoinTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // This endpoint is now deprecated since wallets are created automatically during registration
    // Keeping it for backward compatibility but it will return existing wallet info if wallet already exists
    @PostMapping("/create")
    public ResponseEntity<?> createWallet() {
        try {
            // First check if wallet already exists
            TransactionResponseDTO existingWallet = transactionService.getWalletInfo();
            return ResponseEntity.ok(existingWallet);
        } catch (RuntimeException e) {
            // If no wallet exists, create one
            try {
                TransactionResponseDTO walletResponse = transactionService.createWallet();
                return ResponseEntity.ok(walletResponse);
            } catch (RuntimeException createError) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createError.getMessage());
            } catch (Exception createError) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Error creating wallet: " + createError.getMessage());
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching wallet information: " + e.getMessage());
        }
    }

    @PostMapping("/recharge")
    public ResponseEntity<?> rechargeWallet(@Valid @RequestBody RechargeRequestDTO request) {
        try {
            TransactionResponseDTO response = transactionService.rechargeWallet(
                    BigDecimal.valueOf(request.getAmount())
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing recharge: " + e.getMessage());
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdrawFunds(@Valid @RequestBody WithdrawRequestDTO request) {
        try {
            TransactionResponseDTO response = transactionService.withdrawFunds(
                    BigDecimal.valueOf(request.getAmount()),
                    request.getBankName(),
                    request.getAccountNumber(),
                    request.getAccountHolderName()
            );
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing withdrawal: " + e.getMessage());
        }
    }

    @PostMapping("/freeze-amount")
    public ResponseEntity<?> freezeAmount(
            @RequestParam("amount") double freezeAmount,
            @RequestParam("auctionId") UUID auctionId) {
        try {
            TransactionResponseDTO response = transactionService.freezeAmount(freezeAmount, auctionId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error freezing amount: " + e.getMessage());
        }
    }

    // Admin endpoint - requires ADMIN role
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @PostMapping("/unfreeze-amount")
    public ResponseEntity<?> unfreezeAmount(
            @RequestParam("userId") UUID userId,
            @RequestParam("unfreezeAmount") double unfreezeAmount,
            @RequestParam("reason") String reason) {
        try {
            TransactionResponseDTO response = transactionService.unfreezeAmount(userId, unfreezeAmount, reason);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error unfreezing amount: " + e.getMessage());
        }
    }

    // Admin endpoint - requires ADMIN role
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @PostMapping("/complete-transaction")
    public ResponseEntity<?> completeBidTransaction(
            @RequestParam("userId") UUID userId,
            @RequestParam("auctionId") UUID auctionId,
            @RequestParam("amount") double amount) {
        try {
            TransactionResponseDTO response = transactionService.completeBidTransaction(userId, auctionId, amount);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error completing transaction: " + e.getMessage());
        }
    }

    // Admin endpoint - requires ADMIN role
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @PostMapping("/process-transaction/{transactionId}")
    public ResponseEntity<?> processTransaction(@PathVariable UUID transactionId) {
        try {
            TransactionResponseDTO transaction = transactionService.processTransaction(transactionId);
            return ResponseEntity.ok(transaction);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing transaction: " + e.getMessage());
        }
    }

    @GetMapping("/transaction-history")
    public ResponseEntity<?> getTransactionHistory() {
        try {
            List<TransactionResponseDTO> transactions = transactionService.getTransactionHistory();
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching transaction history: " + e.getMessage());
        }
    }

    @GetMapping("/wallet-info")
    public ResponseEntity<?> getWalletInfo() {
        try {
            TransactionResponseDTO walletInfo = transactionService.getWalletInfo();
            return ResponseEntity.ok(walletInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching wallet information: " + e.getMessage());
        }
    }

}