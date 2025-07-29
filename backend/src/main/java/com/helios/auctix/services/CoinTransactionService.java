package com.helios.auctix.services;

import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.transaction.Transaction;
import com.helios.auctix.domain.transaction.Wallet;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.TransactionResponseDTO;
import com.helios.auctix.events.notification.NotificationEventPublisher;
import com.helios.auctix.repositories.TransactionRepository;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.repositories.WalletRepository;
import com.helios.auctix.services.user.UserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.logging.Logger;

@Service
public class CoinTransactionService {

    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;
    private final NotificationEventPublisher notificationEventPublisher;
    private static final Logger log = Logger.getLogger(CoinTransactionService.class.getName());

    @Autowired
    public CoinTransactionService(
            TransactionRepository transactionRepository,
            WalletRepository walletRepository,
            UserRepository userRepository,
            UserDetailsService userDetailsService,
            NotificationEventPublisher notificationEventPublisher) {
        this.transactionRepository = transactionRepository;
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;
        this.notificationEventPublisher = notificationEventPublisher;
    }

    @Transactional
    public TransactionResponseDTO createWalletForUser(UUID userId) {
        try {
            log.info("Creating wallet for user: " + userId);
            
            // Check if wallet already exists for the user
            List<Wallet> existingWallets = walletRepository.findAllByUserId(userId);

            if (!existingWallets.isEmpty()) {
                // User already has at least one wallet
                log.warning("User " + userId + " already has a wallet");
                throw new RuntimeException("Wallet already exists for this user");
            }

            // Create a new wallet with an initial balance of 0
            Wallet wallet = Wallet.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .amount(BigDecimal.ZERO)
                    .freezeAmount(BigDecimal.ZERO)
                    .transactionType("INITIAL")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Wallet savedWallet = walletRepository.save(wallet);
            log.info("Wallet created successfully for user: " + userId);

            return TransactionResponseDTO.builder()
                    .id(savedWallet.getId())
                    .walletId(savedWallet.getId())
                    .userId(userId)
                    .amount(savedWallet.getAmount())
                    .freezeAmount(savedWallet.getFreezeAmount())
                    .transactionType(savedWallet.getTransactionType())
                    .createdAt(savedWallet.getCreatedAt())
                    .updatedAt(savedWallet.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            // Log the error for debugging
            log.severe("Error creating wallet for user " + userId + ": " + e.getMessage());
            // Rethrow the exception
            throw e;
        }
    }

    @Transactional
    public TransactionResponseDTO createWallet() {
        try {
            User currentUser = getCurrentUser();
            UUID userId = currentUser.getId();

            // Check if wallet already exists for the user
            List<Wallet> existingWallets = walletRepository.findAllByUserId(userId);

            if (!existingWallets.isEmpty()) {
                // User already has at least one wallet
                throw new RuntimeException("Wallet already exists for this user");
            }

            // Create a new wallet with an initial balance of 0
            Wallet wallet = Wallet.builder()
                    .id(UUID.randomUUID())
                    .userId(userId)
                    .amount(BigDecimal.ZERO)
                    .freezeAmount(BigDecimal.ZERO)
                    .transactionType("INITIAL")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Wallet savedWallet = walletRepository.save(wallet);

            return TransactionResponseDTO.builder()
                    .id(savedWallet.getId())
                    .walletId(savedWallet.getId())
                    .userId(userId)
                    .amount(savedWallet.getAmount())
                    .freezeAmount(savedWallet.getFreezeAmount())
                    .transactionType(savedWallet.getTransactionType())
                    .createdAt(savedWallet.getCreatedAt())
                    .updatedAt(savedWallet.getUpdatedAt())
                    .build();
        } catch (Exception e) {
            // Log the error for debugging
            log.severe("Error creating wallet: " + e.getMessage());
            e.printStackTrace();
            // Rethrow the exception
            throw e;
        }
    }

    @Transactional
    public TransactionResponseDTO rechargeWallet(BigDecimal amount) {
        User currentUser = getCurrentUser();
        UUID userId = currentUser.getId();

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Recharge amount must be greater than zero");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found, please create one first"));

        // Add funds to wallet
        wallet.setAmount(wallet.getAmount().add(amount));
        wallet.setUpdatedAt(LocalDateTime.now());
        wallet = walletRepository.save(wallet);

        // Create transaction record
        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .transactionDate(LocalDateTime.now())
                .status("CREDITED")
                .amount(amount)
                .description("Wallet recharge")
                .build();

        transaction = transactionRepository.save(transaction);


        Transaction finalTransaction = transaction;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                String title = "Wallet Recharged Successfully!";
                String message = "Your wallet was successfully credited with " + finalTransaction.getAmount() +
                        " at " + finalTransaction.getTransactionDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        + ". Description: " + finalTransaction.getDescription();
                notificationEventPublisher.publishNotificationEvent(
                        title,
                        message,
                        NotificationCategory.WALLET_RECHARGE_SUCCESS,
                        currentUser,
                        null
                );
            }
        });

        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

    @Transactional
    public TransactionResponseDTO withdrawFunds(BigDecimal amount, String bankName, String accountNumber, String accountHolderName) {
        User currentUser = getCurrentUser();
        UUID userId = currentUser.getId();

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found, please create one first"));

        // Check if user has sufficient funds
        if (wallet.getAmount().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient funds for withdrawal");
        }

        // Deduct funds from wallet
        wallet.setAmount(wallet.getAmount().subtract(amount));
        wallet.setUpdatedAt(LocalDateTime.now());
        wallet = walletRepository.save(wallet);

        // Create description with bank details
        String description = "Funds withdrawal to " + bankName + " account ending with " +
                (accountNumber != null ? accountNumber.substring(Math.max(0, accountNumber.length() - 4)) : "");

        // Create transaction record
        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .transactionDate(LocalDateTime.now())
                .status("DEBITED")
                .amount(amount)
                .description(description)
                .build();

        transaction = transactionRepository.save(transaction);

        Transaction finalTransaction = transaction;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                String title = "Wallet withdrawal successful!";
                String message = "Your wallet was successfully debited with " + finalTransaction.getAmount() +
                        " at " + finalTransaction.getTransactionDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                        + ". Description: " + finalTransaction.getDescription();
                notificationEventPublisher.publishNotificationEvent(
                        title,
                        message,
                        NotificationCategory.WALLET_WITHDRAWAL_SUCCESS,
                        currentUser,
                        null
                );
            }
        });

        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

    @Transactional
    public TransactionResponseDTO freezeAmount(double freezeAmount, UUID auctionId) {
        User currentUser = getCurrentUser();
        UUID userId = currentUser.getId();

        log.info("Freezing " + freezeAmount + " for user " + userId + " on auction " + auctionId);

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    log.warning("Wallet not found for user " + userId + " - creating one automatically");
                    try {
                        createWalletForUser(userId);
                        return walletRepository.findByUserId(userId)
                                .orElseThrow(() -> new RuntimeException("Failed to create wallet for user ID: " + userId));
                    } catch (Exception e) {
                        log.severe("Failed to auto-create wallet for user " + userId + ": " + e.getMessage());
                        throw new RuntimeException("Wallet not found for user ID: " + userId + " and failed to create one: " + e.getMessage());
                    }
                });

        BigDecimal freezeValue = BigDecimal.valueOf(freezeAmount);

        if (wallet.getAmount().compareTo(freezeValue) < 0) {
            log.warning("Insufficient balance: " + wallet.getAmount() + " < " + freezeValue);
            throw new IllegalArgumentException("Insufficient wallet balance to freeze the requested amount");
        }

        // Deduct from available balance and update freeze amount
        wallet.setAmount(wallet.getAmount().subtract(freezeValue));
        wallet.setFreezeAmount(wallet.getFreezeAmount().add(freezeValue));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // Create transaction record
        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .amount(freezeValue)
                .status("FREEZED")
                .transactionDate(LocalDateTime.now())
                .description("Amount frozen for bid on auction " + auctionId)
                .build();

        transactionRepository.save(transaction);

        log.info("Successfully froze funds. New wallet balance: " + wallet.getAmount() + ", frozen: " + wallet.getFreezeAmount());

        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(transaction.getAmount())
                .freezeAmount(wallet.getFreezeAmount())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

    /**
     * Special method for unfreezing amount for a specific user - used by system for bid operations
     */
    @Transactional
    public TransactionResponseDTO unfreezeAmount(UUID userId, double unfreezeAmount, String reason) {
        log.info("Unfreezing " + unfreezeAmount + " for user " + userId + " reason: " + reason);

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found for user ID: " + userId));

        BigDecimal unfreezeValue = BigDecimal.valueOf(unfreezeAmount);

        if (wallet.getFreezeAmount().compareTo(unfreezeValue) < 0) {
            log.warning("Cannot unfreeze: " + wallet.getFreezeAmount() + " < " + unfreezeValue);
            throw new IllegalArgumentException("Cannot unfreeze more than the frozen amount");
        }

        // Return funds from frozen amount to available balance
        wallet.setFreezeAmount(wallet.getFreezeAmount().subtract(unfreezeValue));
        wallet.setAmount(wallet.getAmount().add(unfreezeValue));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // Create transaction record
        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .amount(unfreezeValue)
                .status("UNFREEZED")
                .transactionDate(LocalDateTime.now())
                .description("Amount unfrozen: " + reason)
                .build();

        transactionRepository.save(transaction);

        log.info("Successfully unfroze funds. New wallet balance: " + wallet.getAmount() + ", frozen: " + wallet.getFreezeAmount());

        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(transaction.getAmount())
                .freezeAmount(wallet.getFreezeAmount())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

    @Transactional
    public TransactionResponseDTO completeBidTransaction(UUID userId, UUID auctionId, double amount) {
        log.info("Completing transaction for " + amount + " for user " + userId + " on auction " + auctionId);

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found for user ID: " + userId));

        BigDecimal transactionAmount = BigDecimal.valueOf(amount);

        // Verify frozen amount covers the transaction
        if (wallet.getFreezeAmount().compareTo(transactionAmount) < 0) {
            log.warning("Insufficient frozen funds: " + wallet.getFreezeAmount() + " < " + transactionAmount);
            throw new IllegalArgumentException("Insufficient frozen funds to complete transaction");
        }

        // Reduce frozen amount (funds are now considered spent)
        wallet.setFreezeAmount(wallet.getFreezeAmount().subtract(transactionAmount));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        // Create transaction record
        Transaction transaction = Transaction.builder()
                .id(UUID.randomUUID())
                .wallet(wallet)
                .amount(transactionAmount)
                .status("COMPLETED")
                .transactionDate(LocalDateTime.now())
                .description("Auction completed: " + auctionId)
                .build();

        transactionRepository.save(transaction);

        log.info("Successfully completed transaction. New frozen balance: " + wallet.getFreezeAmount());

        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(transaction.getAmount())
                .freezeAmount(wallet.getFreezeAmount())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

    @Transactional
    public TransactionResponseDTO creditSellerForAuction(UUID sellerId, UUID auctionId, double amount) {
        log.info("Crediting seller " + sellerId + " with " + amount + " for auction " + auctionId);

        try {
            // Find seller's wallet or create one if it doesn't exist
            Optional<Wallet> existingWallet = walletRepository.findByUserId(sellerId);
            Wallet wallet;

            if (existingWallet.isPresent()) {
                wallet = existingWallet.get();
            } else {
                // Create a new wallet for seller
                log.info("Creating wallet for seller " + sellerId);
                wallet = Wallet.builder()
                        .id(UUID.randomUUID())
                        .userId(sellerId)
                        .amount(BigDecimal.ZERO)
                        .freezeAmount(BigDecimal.ZERO)
                        .transactionType("INITIAL")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                wallet = walletRepository.save(wallet);
            }

            BigDecimal creditAmount = BigDecimal.valueOf(amount);

            // Credit the seller's wallet
            wallet.setAmount(wallet.getAmount().add(creditAmount));
            wallet.setUpdatedAt(LocalDateTime.now());
            wallet = walletRepository.save(wallet);

            // Create transaction record
            Transaction transaction = Transaction.builder()
                    .id(UUID.randomUUID())
                    .wallet(wallet)
                    .amount(creditAmount)
                    .status("CREDITED")
                    .transactionDate(LocalDateTime.now())
                    .description("Payment received for auction: " + auctionId)
                    .build();

            transaction = transactionRepository.save(transaction);

            log.info("Successfully credited seller. New balance: " + wallet.getAmount());

            return TransactionResponseDTO.builder()
                    .id(transaction.getId())
                    .walletId(wallet.getId())
                    .userId(wallet.getUserId())
                    .amount(transaction.getAmount())
                    .status(transaction.getStatus())
                    .description(transaction.getDescription())
                    .transactionDate(transaction.getTransactionDate())
                    .build();

        } catch (Exception e) {
            log.severe("Error crediting seller wallet: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public TransactionResponseDTO processTransaction(UUID transactionId) {
        log.info("Processing transaction: " + transactionId);

        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + transactionId));

        // Check if transaction is already processed
        if ("PROCESSED".equals(transaction.getStatus())) {
            log.info("Transaction " + transactionId + " is already processed");
            return mapToDTO(transaction);
        }

        // Update the transaction status to "PROCESSED"
        transaction.setStatus("PROCESSED");
        transaction = transactionRepository.save(transaction);

        log.info("Successfully processed transaction: " + transactionId);

        return mapToDTO(transaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponseDTO> getTransactionHistory() {
        User currentUser = getCurrentUser();
        UUID userId = currentUser.getId();

        Optional<Wallet> wallet = walletRepository.findByUserId(userId);
        if (wallet.isEmpty()) {
            throw new RuntimeException("Wallet not found, please create one first");
        }

        return wallet.get().getTransactions().stream()
                .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TransactionResponseDTO getWalletInfo() {
        User currentUser = getCurrentUser();
        UUID userId = currentUser.getId();

        List<Wallet> wallets = walletRepository.findAllByUserId(userId);

        if (wallets.isEmpty()) {
            throw new RuntimeException("Wallet not found, please create one first");
        }

        // Use the first wallet found
        Wallet wallet = wallets.get(0);

        return TransactionResponseDTO.builder()
                .walletId(wallet.getId())
                .userId(wallet.getUserId())
                .amount(wallet.getAmount())
                .freezeAmount(wallet.getFreezeAmount())
                .transactionType(wallet.getTransactionType())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("Not authenticated");
        }

        try {
            return userDetailsService.getAuthenticatedUser(authentication);
        } catch (Exception e) {
            throw new RuntimeException("Authentication error: " + e.getMessage());
        }
    }

    private TransactionResponseDTO mapToDTO(Transaction transaction) {
        if (transaction == null) {
            return null;
        }

        return TransactionResponseDTO.builder()
                .id(transaction.getId())
                .walletId(transaction.getWallet().getId())
                .userId(transaction.getWallet().getUserId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .description(transaction.getDescription())
                .transactionDate(transaction.getTransactionDate())
                .build();
    }

}