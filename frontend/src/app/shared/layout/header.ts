import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { CartService } from '../../core/services/cart.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { Address, AddressService } from '../../core/services/address.service';
import { Branch, BranchService } from '../../core/services/branch.service';
import { Product, ProductService } from '../../core/services/product.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { AppNotification, NotificationsService } from '../../core/services/notifications.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, DatePipe, FormsModule],
  template: `
    <header class="header-main" data-testid="header">
      <div class="container-max header-inner">
        <!-- Logo -->
        <a routerLink="/" class="header-logo" data-testid="logo" aria-label="Ir al inicio">
          <img src="/assets/icons/logo-white.webp" alt="Tu Mercadito" class="header-logo-img" />
        </a>

        <!-- Location -->
        <div class="header-location" #locationContainer>
          <button
            type="button"
            class="location-btn"
            (click)="locationOpen.set(!locationOpen())"
            [attr.aria-expanded]="locationOpen()"
            data-testid="location-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span class="location-text">
              <span class="location-caption">Ubicación</span>
              <span class="location-value">
                {{ locationLabel() }}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </span>
          </button>

          @if (locationOpen()) {
            <div class="dropdown location-dropdown" data-testid="location-dropdown">
              <p class="location-section-title px-lg py-sm">Sucursal</p>
              @for (branch of branchService.branches(); track branch.id) {
                <button
                  type="button"
                  class="dropdown-item location-item"
                  [class.is-default]="branch.id === branchService.selectedBranch()?.id"
                  (click)="selectBranch(branch)"
                  [attr.data-testid]="'branch-option-' + branch.id"
                >
                  <span class="location-item-label">{{ branch.name }}</span>
                  <span class="location-item-sub">{{ branch.city }}, {{ branch.state }}</span>
                </button>
              }

              <p class="location-section-title px-lg py-sm">Dirección de entrega</p>
              @if (auth.isAuthed()) {
                @if (branchAddresses().length > 0) {
                  @for (address of branchAddresses(); track address.id) {
                    <button
                      type="button"
                      class="dropdown-item location-item"
                      [class.is-default]="address.id === selectedAddress()?.id"
                      (click)="selectAddress(address)"
                      [attr.data-testid]="'location-option-' + address.id"
                    >
                      <span class="location-item-label">{{ address.label || address.city }}</span>
                      <span class="location-item-sub"
                        >{{ address.street }}, {{ address.city }}</span
                      >
                    </button>
                  }
                  <a
                    routerLink="/account/addresses"
                    class="dropdown-footer"
                    (click)="locationOpen.set(false)"
                    data-testid="location-manage"
                  >
                    Gestionar direcciones
                  </a>
                } @else {
                  <div class="dropdown-empty">
                    <p class="dropdown-empty-title">Sin direcciones guardadas</p>
                    <p class="mb-md text-body-xs text-body">
                      Agrega una dirección para elegir tu zona de entrega.
                    </p>
                    <a
                      routerLink="/account/addresses"
                      class="dropdown-cta"
                      (click)="locationOpen.set(false)"
                      data-testid="location-add"
                    >
                      Agregar dirección
                    </a>
                  </div>
                }
              } @else {
                <div class="dropdown-empty">
                  <p class="dropdown-empty-title">Elige tu ubicación de entrega</p>
                  <p class="mb-md text-body-xs text-body">Ingresa para guardar tus direcciones.</p>
                  <button
                    type="button"
                    class="dropdown-cta"
                    (click)="openLogin()"
                    data-testid="location-login"
                  >
                    Ingresar
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- Search -->
        <div class="header-search" #searchContainer>
          <div class="search-bar">
            <input
              id="header-search"
              type="search"
              placeholder="Buscar productos..."
              class="search-input"
              [value]="search"
              (input)="onSearchInput($event)"
              (keydown.enter)="submitSearch()"
              (focus)="onSearchFocus()"
              name="search"
              autocomplete="off"
              data-testid="header-search-input"
            />
            <button
              type="button"
              class="search-btn"
              (click)="submitSearch()"
              aria-label="Buscar"
              data-testid="search-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>

          @if (searchResults().length > 0 && showDropdown()) {
            <div class="dropdown search-dropdown" data-testid="search-dropdown">
              @for (product of searchResults(); track product.id) {
                <a
                  [routerLink]="['/product', product.id]"
                  class="search-dropdown-item"
                  (click)="onResultClick()"
                  data-testid="search-result-item"
                >
                  @if (product.images && product.images.length > 0) {
                    <img
                      [src]="product.images[0]"
                      [alt]="product.name"
                      class="search-dropdown-img"
                      loading="lazy"
                      decoding="async"
                    />
                  } @else {
                    <span class="search-dropdown-img placeholder">IMG</span>
                  }
                  <div class="search-dropdown-info">
                    <p class="search-dropdown-name">{{ product.name }}</p>
                    <p class="search-dropdown-price">\${{ product.price }}</p>
                  </div>
                </a>
              }
              <button
                type="button"
                class="search-dropdown-more"
                (mousedown)="submitSearch()"
                data-testid="search-see-all"
              >
                Ver todos los resultados
              </button>
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="header-actions">
          <!-- Notifications -->
          @if (auth.isAuthed()) {
            <div class="header-action-wrap" #notifContainer>
              <button
                type="button"
                class="header-icon-btn relative"
                aria-label="Notificaciones"
                (click)="toggleNotifications()"
                data-testid="notifications-button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                @if (notifications.unreadCount() > 0) {
                  <span class="action-badge" data-testid="notifications-badge">{{
                    notifications.unreadCount()
                  }}</span>
                }
              </button>

              @if (notifOpen()) {
                <div class="dropdown notifications-dropdown" data-testid="notifications-dropdown">
                  <div class="notif-header">
                    <span class="text-body-sm font-semibold text-ink">Notificaciones</span>
                    @if (notifications.unreadCount() > 0) {
                      <button
                        type="button"
                        class="notif-mark-all"
                        (click)="notifications.markAllRead()"
                        data-testid="notifications-mark-all"
                      >
                        Marcar leídas
                      </button>
                    }
                  </div>
                  <div class="notif-list">
                    @for (n of notifications.items(); track n.id) {
                      <button
                        type="button"
                        class="notif-item"
                        [class.unread]="!n.read"
                        (click)="openNotification(n)"
                        [attr.data-testid]="'notification-' + n.id"
                      >
                        <span class="notif-item-title">{{ n.title }}</span>
                        @if (n.body) {
                          <span class="notif-item-body">{{ n.body }}</span>
                        }
                        <span class="notif-item-time">{{ n.createdAt | date: 'dd/MM HH:mm' }}</span>
                      </button>
                    } @empty {
                      <p class="notif-empty">Sin notificaciones</p>
                    }
                  </div>
                  <a
                    routerLink="/account/notifications"
                    class="notif-footer"
                    (click)="notifOpen.set(false)"
                    data-testid="notifications-see-all"
                  >
                    Ver todas
                  </a>
                </div>
              }
            </div>
          }

          <!-- Wishlist -->
          <a
            routerLink="/favorites"
            class="header-icon-btn relative"
            aria-label="Favoritos"
            data-testid="favorites-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              ></path>
            </svg>
            @if (favorites.count() > 0) {
              <span class="action-badge" data-testid="favorites-count">{{
                favorites.count()
              }}</span>
            }
          </a>

          <!-- Cart -->
          <button
            type="button"
            class="header-icon-btn relative"
            aria-label="Carrito de compras"
            (click)="cart.openDrawer()"
            data-testid="cart-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
              <path d="M3 6h18"></path>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            @if (cart.count() > 0) {
              <span class="action-badge" data-testid="cart-count">{{ cart.count() }}</span>
            }
          </button>

          <!-- Account -->
          <div class="header-action-wrap" #profileContainer>
            <button
              type="button"
              class="header-icon-btn"
              (click)="profileOpen.set(!profileOpen())"
              [attr.aria-expanded]="profileOpen()"
              aria-label="Cuenta"
              data-testid="profile-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>

            @if (profileOpen()) {
              <div class="dropdown profile-dropdown" data-testid="profile-dropdown">
                @if (auth.user(); as u) {
                  <div class="profile-header">
                    <p class="profile-name">{{ u.firstName }} {{ u.lastName }}</p>
                    <p class="profile-email">{{ u.email }}</p>
                  </div>
                  <a
                    routerLink="/account"
                    class="dropdown-item"
                    (click)="profileOpen.set(false)"
                    data-testid="profile-account"
                    >Mi Cuenta</a
                  >
                  <a
                    routerLink="/orders"
                    class="dropdown-item"
                    (click)="profileOpen.set(false)"
                    data-testid="profile-orders"
                    >Mis Pedidos</a
                  >
                  <a
                    routerLink="/account/addresses"
                    class="dropdown-item"
                    (click)="profileOpen.set(false)"
                    data-testid="profile-addresses"
                    >Mis Direcciones</a
                  >
                  <a
                    routerLink="/favorites"
                    class="dropdown-item"
                    (click)="profileOpen.set(false)"
                    data-testid="profile-favorites"
                    >Favoritos</a
                  >
                  <div class="dropdown-divider"></div>
                  <button
                    type="button"
                    class="dropdown-item"
                    (click)="logout()"
                    data-testid="profile-logout"
                  >
                    Cerrar sesión
                  </button>
                } @else {
                  <button
                    type="button"
                    class="dropdown-item"
                    (click)="openLogin()"
                    data-testid="profile-login"
                  >
                    Ingresar
                  </button>
                  <button
                    type="button"
                    class="dropdown-item"
                    (click)="openRegister()"
                    data-testid="profile-register"
                  >
                    Crear cuenta
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
  styles: `
    .header-main {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .header-inner {
      display: flex;
      align-items: center;
      gap: var(--spacing-xl);
      height: 72px;
    }

    /* ─── Logo ────────────────────────────────────── */
    .header-logo {
      display: flex;
      align-items: center;
      text-decoration: none;
      flex-shrink: 0;
    }

    .header-logo-img {
      height: 34px;
      width: auto;
      display: block;
    }

    /* ─── Location ────────────────────────────────── */
    .header-location {
      position: relative;
      flex-shrink: 0;
    }

    .location-btn {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: transparent;
      border: none;
      border-radius: var(--radius-lg);
      color: var(--color-on-primary);
      cursor: pointer;
      text-align: left;
      transition: background-color 0.15s ease;
    }

    .location-btn:hover {
      background-color: rgba(255, 255, 255, 0.12);
    }

    .location-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }

    .location-caption {
      font-size: var(--text-body-xs);
      color: rgba(255, 255, 255, 0.7);
    }

    .location-value {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xxs);
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
    }

    .location-dropdown {
      min-width: 260px;
    }

    .location-item {
      display: flex;
      flex-direction: column;
    }

    .location-section-title {
      font-size: var(--text-body-xs);
      font-weight: 600;
      color: var(--color-mute);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .location-item-label {
      font-weight: 600;
    }

    .location-item-sub {
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    /* ─── Search ──────────────────────────────────── */
    .header-search {
      position: relative;
      flex: 1;
      min-width: 0;
      display: none;
    }

    @media (min-width: 768px) {
      .header-search {
        display: block;
      }
    }

    .search-bar {
      display: flex;
      align-items: stretch;
      background-color: var(--color-canvas);
      border-radius: var(--radius-pill);
      overflow: hidden;
      height: 44px;
    }

    .search-input {
      flex: 1;
      min-width: 0;
      background: transparent;
      outline: none;
      border: none;
      padding: 0 var(--spacing-lg);
      font-size: var(--text-body-md);
      color: var(--color-ink);
    }

    .search-input::placeholder {
      color: var(--color-mute);
    }

    .search-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      background-color: transparent;
      color: var(--color-primary);
      border: none;
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .search-btn:hover {
      color: var(--color-ink);
    }

    .search-dropdown {
      top: calc(100% + 6px);
      left: 0;
      right: 0;
    }

    .search-dropdown-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-lg);
      text-decoration: none;
      color: var(--color-ink);
      transition: background-color 0.15s ease;
    }

    .search-dropdown-item:hover {
      background-color: var(--color-canvas-soft);
    }

    .search-dropdown-img {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      object-fit: cover;
      flex-shrink: 0;
    }

    .search-dropdown-img.placeholder {
      display: grid;
      place-items: center;
      background-color: var(--color-canvas-soft);
      color: var(--color-mute);
      font-size: 11px;
    }

    .search-dropdown-info {
      flex: 1;
      min-width: 0;
    }

    .search-dropdown-name {
      font-size: var(--text-body-sm-strong);
      font-weight: 500;
      color: var(--color-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
    }

    .search-dropdown-price {
      font-size: var(--text-body-xs);
      color: var(--color-body);
      margin: 0;
    }

    .search-dropdown-more {
      width: 100%;
      text-align: center;
      padding: var(--spacing-sm);
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-primary);
      background: none;
      border: none;
      border-top: 1px solid var(--color-surface-pressed);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    /* ─── Actions ─────────────────────────────────── */
    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-xxs);
      flex-shrink: 0;
      margin-left: auto;
    }

    .header-action-wrap {
      position: relative;
    }

    .header-icon-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-full);
      border: none;
      background: transparent;
      color: var(--color-on-primary);
      cursor: pointer;
      text-decoration: none;
      transition: background-color 0.15s ease;
    }

    .header-icon-btn:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    .action-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background-color: var(--color-accent);
      color: var(--color-on-accent);
      font-size: 11px;
      font-weight: 700;
      border-radius: var(--radius-full);
      min-width: 18px;
      height: 18px;
      display: grid;
      place-items: center;
      padding: 0 4px;
    }

    /* ─── Dropdowns (shared) ──────────────────────── */
    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      overflow: hidden;
      z-index: 100;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: var(--spacing-sm) var(--spacing-lg);
      font-size: var(--text-body-md);
      color: var(--color-ink);
      text-decoration: none;
      background: none;
      border: none;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .dropdown-item:hover {
      background-color: var(--color-canvas-soft);
    }

    .dropdown-footer {
      display: block;
      padding: var(--spacing-sm) var(--spacing-lg);
      text-align: center;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
      border-top: 1px solid var(--color-surface-pressed);
    }

    .dropdown-footer:hover {
      background-color: var(--color-canvas-soft);
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--color-surface-pressed);
      margin: var(--spacing-xxs) 0;
    }

    .dropdown-empty {
      padding: var(--spacing-lg);
      text-align: center;
    }

    .dropdown-empty-title {
      margin: 0 0 var(--spacing-xxs);
      font-size: var(--text-body-md);
      font-weight: 600;
      color: var(--color-ink);
    }

    .dropdown-cta {
      display: block;
      width: 100%;
      box-sizing: border-box;
      text-align: center;
      text-decoration: none;
      padding: var(--spacing-sm) var(--spacing-lg);
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      border-radius: var(--radius-pill);
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      cursor: pointer;
    }

    /* ─── Profile ─────────────────────────────────── */
    .profile-dropdown {
      min-width: 220px;
    }

    .profile-header {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: 1px solid var(--color-surface-pressed);
    }

    .profile-name {
      margin: 0;
      font-size: var(--text-body-md);
      font-weight: 600;
      color: var(--color-ink);
    }

    .profile-email {
      margin: 0;
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    /* ─── Notifications ───────────────────────────── */
    .notifications-dropdown {
      width: 320px;
      max-width: 90vw;
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-sm) var(--spacing-lg);
      border-bottom: 1px solid var(--color-surface-pressed);
    }

    .notif-mark-all {
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: var(--text-body-xs);
      cursor: pointer;
      padding: 0;
    }

    .notif-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .notif-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: var(--spacing-sm) var(--spacing-lg);
      background: none;
      border: none;
      border-bottom: 1px solid var(--color-surface-pressed);
      cursor: pointer;
    }

    .notif-item.unread {
      background-color: var(--color-canvas-softer);
    }

    .notif-item:hover {
      background-color: var(--color-canvas-soft);
    }

    .notif-item-title {
      display: block;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-ink);
    }

    .notif-item-body {
      display: block;
      font-size: var(--text-body-xs);
      color: var(--color-body);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notif-item-time {
      display: block;
      font-size: 11px;
      color: var(--color-mute);
      margin-top: 2px;
    }

    .notif-empty {
      padding: var(--spacing-lg);
      text-align: center;
      font-size: var(--text-body-sm);
      color: var(--color-mute);
    }

    .notif-footer {
      display: block;
      padding: var(--spacing-sm) var(--spacing-lg);
      text-align: center;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
    }

    /* ─── Responsive ──────────────────────────────── */
    @media (max-width: 900px) {
      .header-location {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .header-inner {
        gap: var(--spacing-sm);
      }

      .header-logo-img {
        height: 28px;
      }
    }
  `,
})
export class Header implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly authModal = inject(AuthModalService);
  protected readonly cart = inject(CartService);
  protected readonly favorites = inject(FavoriteService);
  protected readonly notifications = inject(NotificationsService);
  protected readonly settingsService = inject(SiteSettingsService);
  protected readonly branchService = inject(BranchService);
  private readonly productService = inject(ProductService);
  private readonly addressService = inject(AddressService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  protected readonly settings = this.settingsService.settings;
  protected search = '';
  protected readonly searchResults = signal<Product[]>([]);
  protected readonly showDropdown = signal(false);
  protected readonly profileOpen = signal(false);
  protected readonly notifOpen = signal(false);
  protected readonly locationOpen = signal(false);

  protected readonly addresses = signal<Address[]>([]);
  protected readonly selectedAddress = signal<Address | null>(null);

  protected readonly branchAddresses = computed(() => {
    const branchId = this.branchService.selectedBranch()?.id;
    if (!branchId) return this.addresses();
    return this.addresses().filter(
      (address) => !address.branchId || address.branchId === branchId,
    );
  });

  protected readonly locationLabel = computed(() => {
    const selected = this.selectedAddress();
    if (selected) return `${selected.city}, ${selected.country}`;
    const branch = this.branchService.selectedBranch();
    if (branch) return `${branch.city}, ${branch.country}`;
    return 'Elegir ubicación';
  });

  private readonly searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.settingsService.load();
    this.branchService.load();
    this.cart.load();
    this.favorites.load();

    if (this.auth.isAuthed()) {
      this.notifications.load();
      this.addressService.getMine().subscribe((addresses) => {
        this.addresses.set(addresses);
        this.selectedAddress.set(addresses.find((a) => a.isDefault) ?? addresses[0] ?? null);
      });
    }

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term.trim()) {
            this.searchResults.set([]);
            this.showDropdown.set(false);
            return [];
          }
          return this.productService.getAll({ search: term.trim() });
        }),
      )
      .subscribe((products) => {
        this.searchResults.set(products.slice(0, 5));
        this.showDropdown.set(products.length > 0);
      });
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search = value;
    this.searchSubject.next(value);
  }

  protected onSearchFocus(): void {
    if (this.searchResults().length > 0 && this.search.trim()) {
      this.showDropdown.set(true);
    }
  }

  protected submitSearch(): void {
    this.showDropdown.set(false);
    const queryParams: Record<string, string> = {};
    if (this.search.trim()) queryParams['search'] = this.search.trim();
    this.router.navigate(['/shop'], { queryParams });
  }

  protected onResultClick(): void {
    this.showDropdown.set(false);
    this.search = '';
    this.searchResults.set([]);
  }

  protected selectAddress(address: Address): void {
    this.selectedAddress.set(address);
    this.locationOpen.set(false);
  }

  protected selectBranch(branch: Branch): void {
    this.branchService.setSelected(branch);
    const current = this.selectedAddress();
    if (!current || (current.branchId && current.branchId !== branch.id)) {
      const options = this.branchAddresses();
      this.selectedAddress.set(
        options.find((address) => address.isDefault) ?? options[0] ?? null,
      );
    }
    this.locationOpen.set(false);
  }

  protected toggleNotifications(): void {
    const open = !this.notifOpen();
    this.notifOpen.set(open);
    this.profileOpen.set(false);
    if (open && this.auth.isAuthed()) {
      this.notifications.load();
    }
  }

  protected openNotification(notification: AppNotification): void {
    this.notifOpen.set(false);
    if (!notification.read) {
      this.notifications.markRead(notification.id).subscribe();
    }
    if (notification.orderId) {
      this.router.navigate(['/orders'], {
        queryParams: { order: notification.orderId },
      });
    }
  }

  protected openLogin(): void {
    this.profileOpen.set(false);
    this.locationOpen.set(false);
    this.authModal.openLogin();
  }

  protected openRegister(): void {
    this.profileOpen.set(false);
    this.authModal.openRegister();
  }

  protected logout(): void {
    this.auth.logout();
    this.cart.load();
    this.favorites.load();
    this.profileOpen.set(false);
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
      this.profileOpen.set(false);
      this.notifOpen.set(false);
      this.locationOpen.set(false);
    }
  }
}
