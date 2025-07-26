package com.helios.auctix.controllers;

import com.helios.auctix.domain.delivery.Delivery;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.DeliveryCreateDTO;
import com.helios.auctix.dtos.DeliveryDTO;
import com.helios.auctix.dtos.DeliveryUpdateDTO;
import com.helios.auctix.services.DeliveryService;
import com.helios.auctix.services.user.UserDetailsService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/deliveries")
@AllArgsConstructor
@Slf4j
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final UserDetailsService userDetailsService;
    private static final Logger logger = Logger.getLogger(DeliveryController.class.getName());

    @PostMapping
    public ResponseEntity<?> createDelivery(@RequestBody DeliveryCreateDTO deliveryCreateDTO) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            DeliveryDTO createdDelivery = deliveryService.createDelivery(deliveryCreateDTO, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdDelivery);
        } catch (Exception e) {
            logger.warning("Error creating delivery: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating delivery: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<DeliveryDTO>> getAllDeliveries() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            List<DeliveryDTO> deliveries = deliveryService.getAllDeliveriesForUser(currentUser);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            logger.warning("Error fetching deliveries: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/seller")
    public ResponseEntity<List<DeliveryDTO>> getAllSellerDeliveries() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            List<DeliveryDTO> deliveries = deliveryService.getAllDeliveriesForSeller(currentUser);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            logger.warning("Error fetching seller deliveries: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/buyer")
    public ResponseEntity<List<DeliveryDTO>> getAllBuyerDeliveries() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            List<DeliveryDTO> deliveries = deliveryService.getAllDeliveriesForBuyer(currentUser);
            return ResponseEntity.ok(deliveries);
        } catch (Exception e) {
            logger.warning("Error fetching buyer deliveries: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDeliveryById(@PathVariable UUID id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            DeliveryDTO delivery = deliveryService.getDeliveryById(id, currentUser);
            return ResponseEntity.ok(delivery);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error fetching delivery: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching delivery: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDelivery(
            @PathVariable UUID id,
            @RequestBody DeliveryUpdateDTO deliveryUpdateDTO) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            DeliveryDTO updatedDelivery = deliveryService.updateDelivery(id, deliveryUpdateDTO, currentUser);
            return ResponseEntity.ok(updatedDelivery);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error updating delivery: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating delivery: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateDeliveryStatus(
            @PathVariable UUID id,
            @RequestParam("status") String status) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            DeliveryDTO updatedDelivery = deliveryService.updateDeliveryStatus(id, status, currentUser);
            return ResponseEntity.ok(updatedDelivery);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error updating delivery status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating delivery status: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/date")
    public ResponseEntity<?> updateDeliveryDate(
            @PathVariable UUID id,
            @RequestParam("deliveryDate") String deliveryDate) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            DeliveryDTO updatedDelivery = deliveryService.updateDeliveryDate(id, deliveryDate, currentUser);
            return ResponseEntity.ok(updatedDelivery);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error updating delivery date: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating delivery date: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDelivery(@PathVariable UUID id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            deliveryService.deleteDelivery(id, currentUser);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error deleting delivery: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting delivery: " + e.getMessage());
        }
    }
}