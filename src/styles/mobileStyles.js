

export const mobileResponsiveFixStyles = `
  @media (max-width: 620px) {
    html, body, #root {
      max-width: 100%;
      overflow-x: hidden;
    }

    .ed-page {
      width: 100%;
      max-width: 100%;
      overflow-x: hidden;
    }

    .ed-topbar {
      height: auto !important;
      min-height: 72px;
    }

    .ed-topbar-inner {
      width: calc(100% - 24px) !important;
      max-width: 100% !important;
      min-width: 0 !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
      padding: 10px 0 !important;
    }

    .ed-topbar-inner > .brand {
      min-width: 0 !important;
      max-width: 100% !important;
      flex: 0 1 auto !important;
    }

    .ed-topbar-inner > .brand img {
      width: auto !important;
      height: auto !important;
      max-width: min(210px, 58vw) !important;
      max-height: 42px !important;
    }

    .ed-topbar-inner > div:last-child {
      display: flex !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      flex-wrap: wrap !important;
      justify-content: flex-start !important;
      gap: 8px !important;
    }

    .ed-topbar-inner > div:last-child > * {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .ed-topbar-inner > div:last-child .btn,
    .ed-topbar-inner > div:last-child .ed-plan-badge {
      flex: 1 1 110px !important;
      width: auto !important;
      min-height: 42px;
      white-space: normal !important;
      overflow-wrap: anywhere;
    }

    .ed-shell {
      width: calc(100% - 24px) !important;
      max-width: 100% !important;
      min-width: 0 !important;
      overflow-x: hidden;
    }

    .ed-shell > *,
    .ed-heading,
    .ed-heading > *,
    .ed-card,
    .ed-stats-section,
    .ed-results,
    .ed-jobs,
    .ed-job,
    .ed-current-job-overview {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .ed-heading h1 {
      font-size: 28px !important;
      overflow-wrap: anywhere;
    }

    .ed-saved-overlay {
      padding: 10px !important;
      overflow-x: hidden !important;
    }

    .ed-saved-modal {
      width: calc(100vw - 20px) !important;
      max-width: calc(100vw - 20px) !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      padding: 17px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      border-radius: 16px !important;
      margin: 0 !important;
    }

    .ed-saved-head {
      gap: 10px !important;
    }

    .ed-saved-head > div,
    .ed-saved-row,
    .ed-saved-row > *,
    .ed-saved-main,
    .ed-saved-main > *,
    .ed-saved-meta,
    .ed-saved-actions {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .ed-saved-head h2 {
      font-size: 21px !important;
      line-height: 1.22 !important;
      overflow-wrap: anywhere;
    }

    .ed-saved-head p,
    .ed-saved-main b,
    .ed-saved-main span,
    .ed-saved-meta b,
    .ed-saved-meta span {
      overflow-wrap: anywhere;
    }

    .ed-saved-main {
      flex-wrap: wrap !important;
      align-items: flex-start !important;
    }

    .ed-saved-main > div:last-child {
      flex: 1 1 150px;
    }

    .rs-modal-overlay {
      padding: 10px !important;
      overflow-x: hidden !important;
    }

    .rs-modal-card,
    .worker-profile-modal {
      width: calc(100vw - 20px) !important;
      max-width: calc(100vw - 20px) !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      overflow-x: hidden !important;
    }

    .rs-modal-head,
    .rs-modal-head > div,
    .rs-messages,
    .rs-message,
    .rs-msg-form {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .rs-modal-head h2,
    .rs-modal-head p,
    .rs-message,
    .rs-message b,
    .rs-message p {
      overflow-wrap: anywhere;
    }

    .rs-message {
      max-width: 92% !important;
    }

    .rs-msg-form {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    .rs-msg-form textarea,
    .rs-msg-form button {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .lt-chat-overlay {
      padding: 10px !important;
      overflow-x: hidden !important;
    }

    .lt-chat-card {
      width: calc(100vw - 20px) !important;
      max-width: calc(100vw - 20px) !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      overflow-x: hidden !important;
    }

    .lt-chat-head,
    .lt-chat-head > div,
    .lt-chat-body,
    .lt-chat-message,
    .lt-chat-message-head,
    .lt-chat-message-sender,
    .lt-chat-form {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .lt-chat-head h2,
    .lt-chat-head p,
    .lt-chat-message,
    .lt-chat-message p {
      overflow-wrap: anywhere;
    }

    .lt-chat-message {
      width: auto !important;
      max-width: 92% !important;
    }

    .lt-chat-message-head {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 4px !important;
    }

    .lt-chat-message-sender {
      width: 100% !important;
      flex-wrap: wrap !important;
    }

    .lt-chat-message-sender b {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
      overflow-wrap: anywhere !important;
    }

    .lt-chat-form {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    .lt-chat-form textarea,
    .lt-chat-form button {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .chat-conduct-inline [role="note"],
    .chat-conduct-inline [role="note"] > span:last-child {
      min-width: 0 !important;
      max-width: 100% !important;
      overflow-wrap: anywhere;
    }


    /* Mobile worker dashboard: keep cards readable even when monthly awards are shown. */
    .wd-page {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }

    .wd-topbar {
      height: auto !important;
      min-height: 72px;
    }

    .wd-topbar-inner {
      width: calc(100% - 24px) !important;
      max-width: 100% !important;
      min-width: 0 !important;
      flex-wrap: wrap !important;
      gap: 10px !important;
      padding: 10px 0 !important;
    }

    .wd-topbar-inner > .brand {
      min-width: 0 !important;
      max-width: 100% !important;
      flex: 0 1 auto !important;
    }

    .wd-topbar-inner > .brand img {
      width: auto !important;
      height: auto !important;
      max-width: min(210px, 58vw) !important;
      max-height: 42px !important;
    }

    .wd-topbar-inner > div:last-child {
      display: flex !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }

    .wd-topbar-inner > div:last-child > .btn {
      flex: 1 1 140px !important;
      width: auto !important;
      min-width: 0 !important;
      max-width: 100% !important;
      min-height: 42px;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .wd-topbar-inner .wd-mobile-profile-btn {
      flex: 0 0 auto !important;
      width: auto !important;
      min-width: 0 !important;
      min-height: 36px !important;
      padding: 7px 12px !important;
      border-radius: 9px !important;
      font-size: 12px !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
    }

    .wd-topbar-actions {
      justify-content: center !important;
      gap: 8px !important;
    }

    .wd-topbar-actions > .btn,
    .wd-topbar-actions > .wd-mobile-profile-btn {
      flex: 0 0 auto !important;
      width: auto !important;
      min-width: 104px !important;
      max-width: none !important;
      min-height: 36px !important;
      height: 36px !important;
      padding: 6px 13px !important;
      border-radius: 9px !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
    }

    .wd-shell,
    .wd-card,
    .wd-workdays,
    .wd-workday,
    .wd-workday > *,
    .wd-workday-head,
    .wd-workday-head > *,
    .wd-workday-head-main,
    .wd-workday-title,
    .wd-workday-meta,
    .wd-company-meta-line {
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .wd-card {
      padding: 16px !important;
      overflow: hidden !important;
    }

    .wd-workday {
      width: 100% !important;
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 14px !important;
      overflow: hidden !important;
    }

    .wd-workday-head {
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      align-items: center !important;
      gap: 10px 12px !important;
      width: 100% !important;
    }

    .wd-workday-head > .wd-company-badge {
      grid-column: 1 !important;
      grid-row: 1 !important;
      align-self: center !important;
    }

    .wd-workday-head > span[aria-label="Šį mėnesį galiojantys mėnesio apdovanojimai"] {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: start !important;
      display: flex !important;
      flex-wrap: wrap !important;
      min-width: 0 !important;
      max-width: 100% !important;
      gap: 6px !important;
    }

    .wd-workday-head .monthly-award-hover,
    .wd-workday-head .monthly-award-hover > img {
      width: 42px !important;
      height: 42px !important;
    }

    .wd-workday-head-main {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
      width: 100% !important;
    }

    .wd-workday-head.history {
      display: block !important;
    }

    .wd-workday-head.history .wd-workday-head-main {
      width: 100% !important;
    }

    .wd-workday-title {
      width: 100% !important;
      align-items: flex-start !important;
    }

    .wd-workday-title h3 {
      flex: 1 1 100% !important;
      width: 100% !important;
      font-size: 17px !important;
      line-height: 1.3 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .wd-workday-phase,
    .wd-workday-status,
    .wd-workday-meta,
    .wd-company-meta-line,
    .wd-next-step,
    .wd-next-step b {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .wd-workday-actions {
      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
    }

    .wd-workday-actions > button {
      width: 100% !important;
      max-width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    /* Employer worker cards: awards must not steal the text column. */
    .ed-attendance-panel,
    .ed-attendance-list,
    .ed-attendance-row,
    .ed-attendance-row > *,
    .ed-results,
    .ed-worker,
    .ed-worker > *,
    .ed-worker-id,
    .ed-worker-id > * {
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .ed-attendance-panel {
      padding: 14px !important;
      overflow: hidden !important;
    }

    .ed-worker-id {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 9px !important;
      width: 100% !important;
    }

    .ed-worker-id > div:last-child,
    .ed-worker-id > .ed-worker-main {
      flex: 1 1 170px !important;
      width: auto !important;
      min-width: 0 !important;
    }

    .ed-worker-id b,
    .ed-worker-id span,
    .ed-worker-main,
    .ed-worker-main b,
    .ed-worker-main span {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .ed-worker-id > span[aria-label="Šį mėnesį galiojantys mėnesio apdovanojimai"] {
      max-width: 100% !important;
      flex-wrap: wrap !important;
    }

    /* Admin lists/files: long filenames and labels wrap instead of being clipped. */
    .admin-page {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }

    .admin-shell,
    .admin-section,
    .admin-list,
    .admin-row,
    .admin-row > *,
    .admin-row-title,
    .admin-cell,
    .admin-row-actions {
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .admin-row {
      width: 100% !important;
      overflow: hidden !important;
    }

    .admin-row-title b,
    .admin-row-title span,
    .admin-cell b,
    .admin-cell span,
    .admin-file-link,
    .admin-note {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .admin-row > .admin-small-btn,
    .admin-row-actions .admin-small-btn {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      text-align: center !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .admin-topbar-inner {
      padding-top: 14px !important;
      padding-bottom: 16px !important;
      gap: 14px !important;
    }

    .admin-top-actions {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .admin-top-actions > * {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      min-height: 46px !important;
      flex: none !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      box-sizing: border-box !important;
    }

    .admin-top-actions > *:last-child {
      grid-column: auto !important;
      margin-bottom: 0 !important;
    }

    /* Public header stays inside the phone viewport. */
    .home-nav {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
      gap: 8px !important;
    }

    .home-brand {
      min-width: 0 !important;
      max-width: min(130px, 36vw) !important;
      overflow: hidden !important;
    }

    .home-brand img {
      width: auto !important;
      height: auto !important;
      max-width: 100% !important;
      max-height: 40px !important;
    }

    .home-actions {
      min-width: 0 !important;
      margin-left: 0 !important;
      gap: 6px !important;
    }

    .home-login,
    .home-actions > .home-btn {
      min-width: 0 !important;
      padding: 8px 8px !important;
      font-size: 11px !important;
      white-space: nowrap !important;
    }

    /* Billing overview is 2x2 on phones instead of four squeezed columns. */
    .ed-plan-overlay {
      padding: 10px !important;
      overflow-x: hidden !important;
    }

    .ed-plan-modal {
      width: calc(100vw - 20px) !important;
      max-width: calc(100vw - 20px) !important;
      min-width: 0 !important;
      padding: 16px !important;
      box-sizing: border-box !important;
      overflow-x: hidden !important;
    }

    .ed-billing-overview {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .ed-billing-card {
      min-width: 0 !important;
      padding: 11px !important;
    }

    .ed-billing-card b,
    .ed-billing-card small,
    .ed-billing-card span {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    /* Job-info team row: awards/status get their own rows on mobile. */
    .ed-job-info-modal {
      padding: 0 !important;
    }

    .ed-job-info-scroll {
      padding: 16px !important;
      overflow-x: hidden !important;
    }

    .ed-job-info-worker-row {
      grid-template-columns: 44px minmax(0, 1fr) !important;
      gap: 9px 11px !important;
      align-items: center !important;
      overflow: hidden !important;
    }

    .ed-job-info-worker-copy {
      grid-column: 2 !important;
      grid-row: 1 !important;
      min-width: 0 !important;
    }

    .ed-job-info-worker-copy b,
    .ed-job-info-worker-copy span {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }

    .ed-job-info-worker-awards {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
      min-width: 0 !important;
      max-width: 100% !important;
      display: flex !important;
      flex-wrap: wrap !important;
      justify-content: flex-start !important;
    }

    .ed-job-info-worker-awards .monthly-award-hover,
    .ed-job-info-worker-awards .monthly-award-hover > img {
      width: 34px !important;
      height: 34px !important;
    }

    .ed-job-info-worker-status {
      grid-column: 1 / -1 !important;
      grid-row: 3 !important;
      width: 100% !important;
      max-width: 100% !important;
      justify-content: center !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      border-radius: 10px !important;
      padding: 8px 10px !important;
      box-sizing: border-box !important;
    }

    /* Notes inside chats/modals must wrap on narrow screens. */
    .rs-modal-card [role="note"],
    .lt-chat-card [role="note"],
    .rs-modal-card [role="note"] > span,
    .lt-chat-card [role="note"] > span {
      min-width: 0 !important;
      max-width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
    }
  }

  @media (max-width: 760px) {
    .lt-employment-overlay {
      padding: 10px !important;
      overflow-x: hidden !important;
    }

    .lt-employment-modal {
      width: calc(100vw - 20px) !important;
      max-width: calc(100vw - 20px) !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }

    .lt-employment-modal .rs-modal-head,
    .lt-employment-modal .rs-modal-head > div,
    .lt-employed-table,
    .lt-employed-row,
    .lt-employed-row > *,
    .lt-existing-actions,
    .lt-employed-row .lt-existing-actions {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .lt-employment-modal .rs-modal-head h2,
    .lt-employment-modal .rs-modal-head p,
    .lt-employed-row b,
    .lt-employed-meta {
      overflow-wrap: anywhere;
    }

    .lt-employed-row {
      grid-template-columns: minmax(0, 1fr) !important;
      overflow: hidden !important;
    }

    .lt-employed-row .lt-existing-actions {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      width: 100% !important;
      max-width: none !important;
      justify-content: stretch !important;
    }

    .lt-employed-row .lt-existing-actions > button,
    .lt-existing-actions > button {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere;
      box-sizing: border-box !important;
    }
  }

  /* Final compact mobile polish: no squeezed headers, clipped text or uneven action buttons. */
  @media (max-width: 620px) {
    .worker-profile-modal .rs-modal-head {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: start !important;
      gap: 10px !important;
    }

    .worker-profile-modal .rs-modal-head > div:first-child {
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      align-items: center !important;
      gap: 8px 12px !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .worker-profile-modal .rs-modal-head > div:first-child > div:first-child {
      grid-column: 1 !important;
      grid-row: 1 !important;
      width: 46px !important;
      height: 46px !important;
      flex-basis: 46px !important;
    }

    .worker-profile-modal .rs-modal-head > div:first-child > span[aria-label="Šį mėnesį galiojantys mėnesio apdovanojimai"] {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      max-width: 100% !important;
    }

    .worker-profile-modal .rs-modal-head .monthly-award-hover,
    .worker-profile-modal .rs-modal-head .monthly-award-hover > img {
      width: 36px !important;
      height: 36px !important;
    }

    .worker-profile-modal .rs-modal-head > div:first-child > div:last-child {
      grid-column: 2 !important;
      grid-row: 1 !important;
      min-width: 0 !important;
    }

    .worker-profile-modal .rs-modal-head h2 {
      font-size: 20px !important;
      line-height: 1.2 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .worker-profile-modal .eyebrow {
      font-size: 10px !important;
      line-height: 1.25 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .wd-kpi {
      min-width: 0 !important;
      padding: 14px 10px !important;
    }

    .wd-kpi > span,
    .wd-kpi small,
    .wd-kpi b {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    .wd-kpi small {
      line-height: 1.35 !important;
    }

    .wd-job-info-actions {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    .wd-job-info-actions > button {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      min-height: 44px !important;
      margin: 0 !important;
      justify-content: center !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      text-align: center !important;
      line-height: 1.2 !important;
      box-sizing: border-box !important;
    }

    .ed-results-head {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 12px !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .ed-results-head > div {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      text-align: left !important;
    }

    .ed-results-head h2,
    .ed-results-head p {
      max-width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .ed-worker-source {
      width: 100% !important;
      max-width: 100% !important;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      overflow: hidden !important;
    }

    .ed-worker-source button {
      min-width: 0 !important;
      width: 100% !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      line-height: 1.2 !important;
    }

    .lt-worker-offer-modal .rs-modal-head {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: start !important;
      gap: 10px !important;
    }

    .lt-worker-offer-modal .rs-modal-head > div:first-child {
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      align-items: center !important;
      gap: 8px 12px !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .lt-worker-offer-modal .rs-modal-head > div:first-child > .wd-company-badge {
      grid-column: 1 !important;
      grid-row: 1 !important;
      width: 46px !important;
      height: 46px !important;
    }

    .lt-worker-offer-modal .rs-modal-head > div:first-child > span[aria-label="Šį mėnesį galiojantys mėnesio apdovanojimai"] {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      max-width: 100% !important;
    }

    .lt-worker-offer-modal .rs-modal-head .monthly-award-hover,
    .lt-worker-offer-modal .rs-modal-head .monthly-award-hover > img {
      width: 36px !important;
      height: 36px !important;
    }

    .lt-worker-offer-modal .rs-modal-head > div:first-child > div:last-child {
      grid-column: 2 !important;
      grid-row: 1 !important;
      min-width: 0 !important;
      max-width: 100% !important;
    }

    .lt-worker-offer-modal .rs-modal-head h2,
    .lt-worker-offer-modal .rs-modal-head .eyebrow,
    .lt-worker-offer-modal .rs-modal-head > div:first-child > div:last-child > div {
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    .lt-worker-offer-modal .rs-modal-head h2 {
      font-size: 20px !important;
      line-height: 1.2 !important;
    }
  }


  /* Stronger mobile polish for the employer open-job screen. */
  @media (max-width: 620px) {
    .ed-current-job-overview {
      border-radius: 18px !important;
    }

    .ed-current-job-overview-head {
      padding: 14px 14px 12px !important;
      gap: 12px !important;
    }

    .ed-current-job-overview-head h2 {
      font-size: 18px !important;
      line-height: 1.16 !important;
      margin-bottom: 6px !important;
    }

    .ed-current-job-head-meta {
      font-size: 12px !important;
      gap: 4px 8px !important;
    }

    .ed-current-job-head-actions {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      gap: 8px !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    .ed-current-job-head-actions > * {
      width: 100% !important;
      min-height: 42px !important;
      justify-content: center !important;
      text-align: center !important;
      white-space: normal !important;
    }

    .ed-current-job-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      padding: 10px 10px 0 !important;
    }

    .ed-current-job-field,
    .ed-current-job-field.wide {
      grid-column: span 1 !important;
      min-height: 0 !important;
      padding: 10px 11px !important;
      border-radius: 12px !important;
    }

    .ed-current-job-field.wide:first-child,
    .ed-current-job-field.wide:last-child {
      grid-column: 1 / -1 !important;
    }

    .ed-current-job-field span {
      font-size: 9.5px !important;
      margin-bottom: 4px !important;
    }

    .ed-current-job-field b {
      font-size: 12.5px !important;
      line-height: 1.35 !important;
    }

    .ed-current-job-description {
      margin: 10px !important;
      padding: 12px !important;
    }

    .ed-current-job-description-copy.collapsed {
      display: -webkit-box !important;
      -webkit-line-clamp: 4 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }

    .ed-description-toggle {
      margin-top: 10px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: 36px !important;
      padding: 8px 12px !important;
      border-radius: 999px !important;
      border: 1px solid #d9e3ea !important;
      background: #fff !important;
      color: #102438 !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      cursor: pointer !important;
    }

    .ed-attendance-panel {
      margin-top: 18px !important;
      padding: 14px 12px !important;
      border-radius: 16px !important;
    }

    .ed-attendance-panel h2 {
      font-size: 17px !important;
      line-height: 1.2 !important;
    }

    .ed-attendance-help {
      font-size: 11.5px !important;
      line-height: 1.45 !important;
    }

    .ed-attendance-list {
      gap: 10px !important;
      margin-top: 12px !important;
    }

    .ed-attendance-row {
      padding: 12px !important;
      gap: 10px !important;
      border-radius: 14px !important;
      grid-template-columns: 1fr !important;
      align-items: stretch !important;
    }

    .ed-worker-id {
      align-items: flex-start !important;
      gap: 10px !important;
    }

    .ed-worker-main {
      gap: 5px !important;
    }

    .ed-worker-main > div:first-child {
      gap: 7px !important;
      align-items: flex-start !important;
    }

    .ed-worker-main b {
      font-size: 16px !important;
      line-height: 1.2 !important;
    }

    .ed-worker-main > span {
      font-size: 12px !important;
      line-height: 1.35 !important;
    }

    .ed-worker-status {
      margin-top: 4px !important;
      gap: 6px !important;
    }

    .ed-attendance-badge {
      margin-top: 0 !important;
      padding: 5px 9px !important;
      font-size: 10.5px !important;
      line-height: 1.25 !important;
      white-space: normal !important;
      justify-content: center !important;
      text-align: center !important;
    }

    .ed-next-step {
      margin-top: 2px !important;
      padding: 10px 11px !important;
      border-radius: 12px !important;
      font-size: 12px !important;
      line-height: 1.45 !important;
    }

    .ed-next-step b {
      display: block !important;
      margin-bottom: 3px !important;
      font-size: 12.5px !important;
    }

    .ed-attendance-row > .ed-member-metrics,
    .ed-member-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      min-width: 0 !important;
      width: 100% !important;
    }

    .ed-member-metric {
      padding: 10px !important;
      border-radius: 12px !important;
    }

    .ed-member-metric span {
      font-size: 10.5px !important;
      line-height: 1.25 !important;
      margin-bottom: 4px !important;
    }

    .ed-member-metric b {
      font-size: 18px !important;
      line-height: 1.1 !important;
    }

    .ed-attendance-row > .ed-attendance-actions,
    .ed-attendance-actions {
      width: 100% !important;
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      justify-content: stretch !important;
    }

    .ed-attendance-actions > button,
    .ed-attendance-actions > .ed-team-add,
    .ed-attendance-actions > .ed-secondary,
    .ed-attendance-actions > .ed-primary {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 42px !important;
      padding: 9px 10px !important;
      font-size: 12.5px !important;
      line-height: 1.25 !important;
      white-space: normal !important;
      justify-content: center !important;
      text-align: center !important;
    }

    .ed-attendance-actions > span,
    .ed-attendance-actions > .ed-attendance-badge {
      grid-column: 1 / -1 !important;
      width: 100% !important;
    }

    .ed-results .ed-worker {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
      padding: 12px !important;
      align-items: stretch !important;
    }

    .ed-results .ed-worker > .ed-worker-id,
    .ed-results .ed-worker > .ed-worker-actions {
      grid-column: 1 / -1 !important;
    }

    .ed-results .ed-worker > .ed-worker-activity,
    .ed-results .ed-worker > .ed-metric {
      min-height: 58px !important;
      padding: 10px 11px !important;
      border: 1px solid #e4ebf0 !important;
      border-radius: 12px !important;
      background: #fbfcfd !important;
    }

    .ed-results .ed-worker > .ed-worker-activity {
      justify-content: center !important;
      text-align: center !important;
    }

    .ed-results .ed-worker > .ed-metric {
      justify-items: start !important;
    }

    .ed-results .ed-worker > .ed-metric b {
      font-size: 16px !important;
      line-height: 1.1 !important;
    }

    .ed-results .ed-worker > .ed-metric span {
      font-size: 11px !important;
      line-height: 1.25 !important;
    }

    .ed-results .ed-worker > .ed-worker-actions {
      margin-top: 2px !important;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      max-width: none !important;
      width: 100% !important;
    }

    .ed-results .ed-worker > .ed-worker-actions > button {
      min-height: 42px !important;
      white-space: normal !important;
      text-align: center !important;
    }
  }


  /* Phone-only polish: keep worker profile fully scrollable and place team invite action under favorites. */
  .ed-invite-all-mobile {
    display: none;
  }

  .ed-invite-all-desktop {
    width: auto !important;
    max-width: 100% !important;
    align-self: flex-end !important;
    white-space: nowrap;
  }

  @media (max-width: 620px) {
    .worker-profile-modal {
      max-height: calc(100dvh - 20px) !important;
      height: auto !important;
      overflow: hidden !important;
    }

    .worker-profile-modal-scroll {
      max-height: calc(100dvh - 20px) !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding-bottom: max(32px, env(safe-area-inset-bottom)) !important;
      scroll-padding-bottom: max(32px, env(safe-area-inset-bottom)) !important;
      overscroll-behavior: contain !important;
      -webkit-overflow-scrolling: touch;
    }

    .rs-modal-overlay:has(.worker-profile-modal) {
      align-items: center !important;
      padding: 10px 10px max(14px, env(safe-area-inset-bottom)) !important;
    }

    .ed-invite-all-desktop {
      display: none !important;
    }

    .ed-invite-all-mobile {
      display: flex !important;
      width: 100% !important;
      min-width: 0 !important;
      min-height: 42px !important;
      margin-top: 8px !important;
      padding: 9px 12px !important;
      border-radius: 11px !important;
      font-size: 12.5px !important;
      line-height: 1.2 !important;
      justify-content: center !important;
      text-align: center !important;
      white-space: normal !important;
    }
  }

  /* Compact employer history cards on phones. */
  @media (max-width: 620px) {
    .ed-jobs .ed-job.ed-job-history {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      gap: 6px 10px !important;
      align-items: start !important;
      padding: 11px 12px !important;
      min-height: 0 !important;
    }

    .ed-job-history > .ed-job-date {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: end !important;
      align-self: start !important;
      margin: 1px 0 0 !important;
      color: #7a8996 !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
      font-weight: 750 !important;
      white-space: nowrap !important;
    }

    .ed-job-history > div:nth-child(2) {
      grid-column: 1 !important;
      grid-row: 1 !important;
      min-width: 0 !important;
      padding-right: 4px !important;
    }

    .ed-job-history > div:nth-child(2) > div:first-child b {
      font-size: 15px !important;
      line-height: 1.2 !important;
      overflow-wrap: anywhere !important;
    }

    .ed-job-history > div:nth-child(2) > div:last-child {
      margin-top: 2px !important;
      color: #6c7a88 !important;
      font-size: 11px !important;
      line-height: 1.25 !important;
    }

    .ed-job-history > .ed-progress {
      display: block !important;
      grid-column: 1 !important;
      grid-row: 2 !important;
      align-self: center !important;
      min-width: 0 !important;
      color: #526374 !important;
      font-size: 11px !important;
      line-height: 1.3 !important;
      font-weight: 750 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .ed-job-history > .ed-job-state-cell {
      grid-column: 2 !important;
      grid-row: 2 !important;
      justify-self: end !important;
      align-self: center !important;
      min-width: 0 !important;
      max-width: 150px !important;
      text-align: right !important;
    }

    .ed-job-history .ed-job-state {
      padding: 4px 7px !important;
      font-size: 10px !important;
      line-height: 1.2 !important;
      white-space: normal !important;
    }

    .ed-job-history .ed-job-state-detail {
      margin-top: 3px !important;
      font-size: 10px !important;
      line-height: 1.25 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
    }

    .ed-job-history > .ed-job-actions {
      grid-column: 1 / -1 !important;
      grid-row: 3 !important;
      margin-top: 3px !important;
      gap: 6px !important;
    }

    .ed-job-history > .ed-job-actions button {
      min-height: 38px !important;
      padding: 7px 9px !important;
      font-size: 11.5px !important;
      line-height: 1.2 !important;
      white-space: normal !important;
    }
  }



  @media (min-width: 621px) {
    .wd-kpi-issues .wd-kpi-issue-breakdown {
      grid-template-columns: 1fr !important;
    }
  }

  /* Additional compact worker dashboard polish: denser phone cards, history carousel and tighter detail modals. */
  @media (max-width: 620px) {
    .wd-overview-card-disputes {
      display: none !important;
    }
    .wd-overview {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }

    .wd-overview > .wd-overview-card:last-child {
      grid-column: 1 / -1 !important;
    }

    .wd-overview-card {
      padding: 12px !important;
      border-radius: 16px !important;
      min-height: 112px !important;
    }

    .wd-overview-card span {
      font-size: 10px !important;
      line-height: 1.25 !important;
    }

    .wd-overview-card b {
      font-size: 18px !important;
      line-height: 1.15 !important;
      margin-top: 5px !important;
    }

    .wd-overview-card.next-work b {
      font-size: 15px !important;
    }

    .wd-overview-card small {
      white-space: normal !important;
      font-size: 11px !important;
      line-height: 1.38 !important;
      margin-top: 4px !important;
    }

    .wd-overview-open {
      padding: 4px 7px !important;
      font-size: 10px !important;
    }

    .wd-kpis {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 10px !important;
    }

    .wd-kpis > .wd-kpi:last-child {
      grid-column: 1 / -1 !important;
    }

    .wd-kpi {
      padding: 13px 11px !important;
      min-height: 118px !important;
      border-radius: 16px !important;
    }

    .wd-kpi > span,
    .wd-kpi-info-btn {
      min-height: 0 !important;
      font-size: 12px !important;
      line-height: 1.3 !important;
    }

    .wd-kpi b {
      min-height: 0 !important;
      margin-top: 7px !important;
      font-size: 22px !important;
      line-height: 1.1 !important;
    }

    .wd-kpi small {
      margin-top: 6px !important;
      font-size: 11px !important;
      line-height: 1.35 !important;
    }

    .wd-history-section-head {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 10px !important;
      margin-bottom: 10px !important;
    }

    .wd-history-section-head h2 {
      margin: 0 !important;
    }

    .wd-history-section-count {
      flex: 0 0 auto !important;
      border-radius: 999px !important;
      padding: 6px 10px !important;
      background: #f3f6f8 !important;
      color: #526374 !important;
      font-size: 11px !important;
      font-weight: 800 !important;
    }

    .wd-history-mobile {
      display: grid !important;
      gap: 10px !important;
    }

    .wd-history-carousel-head {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 10px !important;
      padding: 10px 0 2px !important;
    }

    .wd-history-carousel-copy {
      min-width: 0 !important;
    }

    .wd-history-carousel-copy b {
      display: block !important;
      margin-bottom: 3px !important;
      font-size: 13px !important;
    }

    .wd-history-carousel-copy span {
      display: block !important;
      color: #6c7a88 !important;
      font-size: 11px !important;
      line-height: 1.35 !important;
    }

    .wd-history-nav {
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      flex: 0 0 auto !important;
    }

    .wd-history-nav button {
      width: 38px !important;
      height: 38px !important;
      border-radius: 12px !important;
      border: 1px solid #d7e1e8 !important;
      background: #fff !important;
      color: #102438 !important;
      font-size: 20px !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      cursor: pointer !important;
    }

    .wd-history-nav button:disabled {
      opacity: 0.42 !important;
      cursor: default !important;
    }

    #worker-job-history {
      padding: 16px !important;
    }

    #worker-job-history .wd-workday {
      padding: 14px !important;
      gap: 12px !important;
      border-radius: 16px !important;
    }

    #worker-job-history .wd-workday h3 {
      font-size: 16px !important;
      line-height: 1.28 !important;
    }

    #worker-job-history .wd-company-meta-line {
      font-size: 13px !important;
      line-height: 1.45 !important;
    }

    #worker-job-history .wd-workday-actions > button {
      min-height: 42px !important;
      font-size: 12.5px !important;
    }
  }

  @media (min-width: 621px) {
    .wd-history-mobile {
      display: none !important;
    }
  }

  @media (min-width: 761px) {
    .wd-job-info-modal {
      width: min(720px, 100%) !important;
      max-height: calc(100dvh - 40px) !important;
    }

    .wd-job-info-head {
      padding: 18px 20px 14px !important;
    }

    .wd-job-info-head h2 {
      font-size: 23px !important;
    }

    .wd-job-info-scroll {
      padding: 14px 18px 18px !important;
    }

    .wd-job-info-grid {
      gap: 10px !important;
      margin-bottom: 14px !important;
    }

    .lt-worker-offer-modal {
      width: min(900px, calc(100vw - 40px)) !important;
      max-height: calc(100dvh - 40px) !important;
    }

    .lt-worker-offer-scroll {
      padding: 16px 18px 18px !important;
    }

    .lt-worker-offer-modal .rs-modal-head {
      margin-bottom: 14px !important;
      padding-bottom: 14px !important;
    }

    .lt-worker-offer-modal .lt-detail-grid {
      gap: 10px !important;
    }

    .lt-worker-offer-modal .lt-detail-card {
      padding: 12px !important;
      border-radius: 14px !important;
      min-height: 0 !important;
    }

    .lt-employment-modal {
      width: min(1000px, calc(100vw - 40px)) !important;
      padding: 18px !important;
    }

    .lt-employment-modal .lt-employed-row,
    .lt-employment-modal .lt-existing-offer {
      padding: 12px 14px !important;
      gap: 12px !important;
    }
  }



  /* Phone-only admin layout fixes: keep analytics and presentation inside viewport. */
  @media (max-width: 620px) {
    .admin-page,
    .admin-shell,
    .admin-section,
    .admin-section-head,
    .admin-traffic,
    .admin-traffic-grid,
    .admin-traffic-grid > *,
    .admin-traffic-top,
    .admin-presentation-share,
    .admin-presentation-link,
    .admin-presentation-actions {
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .admin-page {
      overflow-x: hidden !important;
    }

    .admin-shell {
      width: calc(100% - 20px) !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    .admin-section {
      padding: 16px !important;
      overflow: hidden !important;
    }

    .admin-section-head {
      gap: 10px !important;
    }

    .admin-section-head > div {
      min-width: 0 !important;
    }

    .admin-section h2 {
      font-size: 19px !important;
      line-height: 1.2 !important;
    }

    .admin-muted {
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    .admin-traffic-top {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .admin-traffic-stat {
      padding: 11px 12px !important;
      min-height: 88px !important;
      border-radius: 12px !important;
    }

    .admin-traffic-stat span {
      font-size: 10.5px !important;
      line-height: 1.25 !important;
    }

    .admin-traffic-stat b {
      margin-top: 6px !important;
      font-size: 24px !important;
    }

    .admin-traffic-grid {
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 14px !important;
      width: 100% !important;
    }

    /* 14 days -> two rows of 7 on phone, so nothing pushes the page sideways. */
    .admin-traffic-chart {
      width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      display: grid !important;
      grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
      align-items: end !important;
      gap: 8px 3px !important;
      padding: 10px 5px 7px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .admin-traffic-day {
      min-width: 0 !important;
      width: 100% !important;
      height: 90px !important;
      overflow: hidden !important;
      gap: 3px !important;
    }

    .admin-traffic-bar-wrap {
      width: 100% !important;
      height: 58px !important;
      min-height: 58px !important;
    }

    .admin-traffic-bar {
      width: min(14px, 68%) !important;
    }

    .admin-traffic-value {
      font-size: 8px !important;
      line-height: 1 !important;
    }

    .admin-traffic-day-label {
      width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
      white-space: nowrap !important;
      text-align: center !important;
      font-size: 7.5px !important;
      line-height: 1 !important;
      letter-spacing: -0.02em !important;
    }

    .admin-traffic-cities,
    .admin-traffic-city,
    .admin-traffic-note {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .admin-traffic-city span,
    .admin-traffic-note {
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    .admin-presentation-share {
      grid-template-columns: minmax(0, 1fr) !important;
      width: 100% !important;
      gap: 9px !important;
    }

    .admin-presentation-link {
      width: 100% !important;
      padding: 10px 11px !important;
      font-size: 10.5px !important;
      line-height: 1.45 !important;
      overflow-wrap: anywhere !important;
      word-break: break-word !important;
      white-space: normal !important;
    }

    .admin-presentation-actions {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      width: 100% !important;
      gap: 8px !important;
    }

    .admin-presentation-actions .admin-small-btn {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 42px !important;
      padding: 9px 8px !important;
      font-size: 11.5px !important;
      line-height: 1.2 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      box-sizing: border-box !important;
    }
  }



  /* Phone admin compact grid: four navigation controls in two rows. */
  @media (max-width: 620px) {
    .admin-tabs {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      width: 100% !important;
    }

    .admin-tab {
      min-width: 0 !important;
      width: 100% !important;
      min-height: 58px !important;
      padding: 10px 6px !important;
      border-radius: 12px !important;
      font-size: 11.5px !important;
      line-height: 1.15 !important;
      white-space: normal !important;
      overflow-wrap: anywhere !important;
      text-align: center !important;
    }

    .admin-tabs .admin-extra-trigger {
      display: flex !important;
      gap: 8px;
      padding-right: 8px !important;
    }

    .admin-tabs .admin-extra-panel {
      max-height: min(55vh, 420px);
    }

    .admin-kpis {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .admin-kpi {
      min-width: 0 !important;
      min-height: 104px !important;
      padding: 13px 14px !important;
      border-radius: 14px !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
    }

    .admin-kpi span {
      font-size: 11.5px !important;
      line-height: 1.25 !important;
      overflow-wrap: anywhere !important;
    }

    .admin-kpi b {
      margin-top: 12px !important;
      font-size: 29px !important;
      line-height: 1 !important;
    }
  }

  @media (max-width: 390px) {
    .admin-tab {
      min-height: 56px !important;
      padding: 9px 4px !important;
      font-size: 10.5px !important;
    }

    .admin-kpi {
      min-height: 98px !important;
      padding: 12px !important;
    }

    .admin-kpi span {
      font-size: 10.5px !important;
    }

    .admin-kpi b {
      font-size: 27px !important;
    }
  }



  /* Admin phone header: centered logo and cleaner heading area. */
  @media (max-width: 620px) {
    .admin-topbar-inner > .brand {
      width: 100% !important;
      max-width: 100% !important;
      display: flex !important;
      justify-content: center !important;
      align-self: center !important;
      margin: 0 auto !important;
    }

    .admin-topbar-inner > .brand img {
      margin: 0 auto !important;
      max-width: min(210px, 62vw) !important;
      height: auto !important;
    }

    .admin-head {
      margin-bottom: 14px !important;
    }

    .admin-head > div {
      width: 100% !important;
      min-width: 0 !important;
    }
  }


  /* Mobile density pass: worker dashboard, employer header and worker-facing company profile. */
  @media (max-width: 620px) {
    /* Employer header: centered logo, compact plan/profile/logout in one row. */
    .ed-topbar {
      min-height: 0 !important;
      height: auto !important;
    }

    .ed-topbar-inner {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) !important;
      justify-items: center !important;
      align-items: center !important;
      gap: 8px !important;
      width: calc(100% - 24px) !important;
      padding: 10px 0 11px !important;
    }

    .ed-topbar-inner > .brand {
      justify-self: center !important;
      margin: 0 auto !important;
      max-width: 100% !important;
    }

    .ed-topbar-inner > .brand img {
      max-width: min(188px, 58vw) !important;
      max-height: 38px !important;
    }

    .ed-topbar-inner > div:last-child {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      width: 100% !important;
      gap: 6px !important;
      align-items: stretch !important;
    }

    .ed-topbar-inner > div:last-child > * {
      min-width: 0 !important;
      width: 100% !important;
      min-height: 36px !important;
      padding: 7px 5px !important;
      border-radius: 10px !important;
      font-size: 10.5px !important;
      line-height: 1.15 !important;
      white-space: normal !important;
      text-align: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
    }

    .ed-topbar-inner > div:last-child .ed-plan-badge {
      min-height: 36px !important;
      padding: 7px 5px !important;
      font-size: 10.5px !important;
    }

    /* Worker dashboard: four compact priority cards. */
    .wd-overview-heading {
      margin: 0 0 7px 2px !important;
      font-size: 10.5px !important;
      letter-spacing: .075em !important;
    }

    .wd-overview {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 7px !important;
      margin-bottom: 14px !important;
    }

    .wd-overview > .wd-overview-card:last-child {
      grid-column: auto !important;
    }

    .wd-overview-card {
      min-height: 84px !important;
      padding: 9px 10px !important;
      border-radius: 13px !important;
    }

    .wd-overview-card-top {
      min-height: 19px !important;
      gap: 5px !important;
    }

    .wd-overview-card span {
      font-size: 9px !important;
      line-height: 1.2 !important;
      letter-spacing: .035em !important;
    }

    .wd-overview-card b,
    .wd-overview-card.next-work b {
      margin-top: 4px !important;
      font-size: 16px !important;
      line-height: 1.08 !important;
    }

    .wd-overview-card small {
      margin-top: 3px !important;
      font-size: 9.7px !important;
      line-height: 1.25 !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
      white-space: normal !important;
    }

    .wd-overview-open {
      padding: 3px 5px !important;
      border-radius: 6px !important;
      font-size: 9px !important;
    }

    /* Worker statistics: visibly shorter without losing the five indicators. */
    .wd-stats-section {
      margin-bottom: 14px !important;
    }

    .wd-stats-head {
      margin-bottom: 7px !important;
    }

    .wd-stats-toggle {
      gap: 6px !important;
      font-size: 10.5px !important;
      letter-spacing: .065em !important;
    }

    .wd-kpis {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 7px !important;
    }

    .wd-kpi {
      min-height: 86px !important;
      padding: 9px 8px !important;
      border-radius: 13px !important;
    }

    .wd-kpi > span,
    .wd-kpi-info-btn,
    .wd-kpi-info-label {
      font-size: 10px !important;
      line-height: 1.2 !important;
    }

    .wd-kpi b {
      margin-top: 5px !important;
      font-size: 19px !important;
      line-height: 1.05 !important;
    }

    .wd-kpi small {
      margin-top: 4px !important;
      font-size: 9.5px !important;
      line-height: 1.25 !important;
      white-space: normal !important;
    }

    .wd-kpis > .wd-kpi:last-child {
      grid-column: 1 / -1 !important;
      min-height: 62px !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      align-items: center !important;
      gap: 5px 12px !important;
      text-align: left !important;
    }

    .wd-kpis > .wd-kpi:last-child > span {
      grid-column: 1 !important;
      grid-row: 1 !important;
    }

    .wd-kpis > .wd-kpi:last-child > b {
      grid-column: 2 !important;
      grid-row: 1 / span 2 !important;
      margin: 0 !important;
      font-size: 22px !important;
    }

    .wd-kpis > .wd-kpi:last-child > small {
      grid-column: 1 !important;
      grid-row: 2 !important;
      margin: 0 !important;
    }

    .wd-kpis > .wd-kpi.wd-kpi-issues {
      grid-column: 1 / -1 !important;
      min-height: 0 !important;
      display: grid !important;
      grid-template-columns: 1fr !important;
      grid-template-rows: auto auto !important;
      gap: 6px !important;
      text-align: left !important;
      padding: 11px 10px !important;
    }

    .wd-kpis > .wd-kpi.wd-kpi-issues > span {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-content: flex-start !important;
      min-height: 0 !important;
    }

    .wd-kpi-issues .wd-kpi-issue-breakdown {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
      margin-top: 0 !important;
      gap: 6px !important;
      grid-template-columns: 1fr !important;
    }

    .wd-kpi-issues .wd-kpi-issue-breakdown > span {
      padding: 6px 8px !important;
      font-size: 10px !important;
      line-height: 1.2 !important;
      border-radius: 9px !important;
    }

    .wd-kpi-issues .wd-kpi-issue-breakdown strong {
      font-size: 10px !important;
    }

    /* Worker-facing company profile: identity then 3 compact metrics in one row. */
    .wd-company-profile-modal .wd-job-info-head {
      padding: 14px 15px 12px !important;
    }

    .wd-company-profile-modal .wd-job-info-head h2 {
      margin-top: 5px !important;
      font-size: 20px !important;
    }

    .wd-company-profile-modal .wd-job-info-scroll {
      padding: 11px 12px 14px !important;
    }

    .wd-company-profile-identity {
      padding: 10px !important;
      border-radius: 13px !important;
    }

    .wd-company-profile-identity > div {
      gap: 9px !important;
      flex-wrap: nowrap !important;
    }

    .wd-company-profile-identity b {
      font-size: 16px !important;
    }

    .wd-company-profile-identity [style*="margin-top: 4px"] {
      margin-top: 2px !important;
      font-size: 11.5px !important;
    }

    .wd-company-profile-metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 6px !important;
    }

    .wd-company-profile-metric {
      min-width: 0 !important;
      padding: 8px 6px !important;
      border-radius: 12px !important;
      text-align: center !important;
    }

    .wd-company-profile-metric > div {
      font-size: 8.5px !important;
      line-height: 1.2 !important;
      min-height: 21px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .wd-company-profile-metric > b {
      margin-top: 3px !important;
      font-size: 15px !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
    }

    /* Employer statistics also stay denser on phones. */
    .ed-stats-section {
      padding: 9px 0 !important;
    }

    .ed-stats-head {
      margin-bottom: 7px !important;
      padding: 0 10px !important;
    }

    .ed-stats-toggle {
      font-size: 10.5px !important;
      gap: 6px !important;
    }

    .ed-kpis,
    .ed-kpis.ed-kpis-eight {
      gap: 7px !important;
    }

    .ed-kpi {
      min-height: 78px !important;
      padding: 10px 8px !important;
      border-radius: 12px !important;
    }

    .ed-kpi span {
      min-height: 0 !important;
      font-size: 10px !important;
      line-height: 1.2 !important;
    }

    .ed-kpi b {
      margin-top: 5px !important;
      font-size: 18px !important;
    }

    /* Employer main screen: shorter intro and tighter action stack. */
    .ed-shell {
      margin-top: 18px !important;
    }

    .ed-heading {
      margin-bottom: 16px !important;
      gap: 12px !important;
    }

    .ed-heading .eyebrow {
      font-size: 10px !important;
    }

    .ed-heading h1 {
      margin-top: 5px !important;
      font-size: 25px !important;
      line-height: 1.12 !important;
    }

    .ed-heading p {
      margin-top: 7px !important;
      font-size: 12.5px !important;
      line-height: 1.42 !important;
    }

    .ed-heading-actions {
      gap: 7px !important;
    }

    .ed-heading-primary-row {
      gap: 7px !important;
    }

    .ed-heading-actions > button,
    .ed-heading-primary-row > button {
      min-height: 42px !important;
      padding: 9px 11px !important;
      border-radius: 11px !important;
      font-size: 12px !important;
    }

    /* Employer active jobs and worker availability: one card/day at a time. */
    .ed-job-scope {
      width: 100% !important;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
    }

    .ed-job-scope button {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 42px !important;
      padding: 9px 10px 9px 11px !important;
      font-size: 11.5px !important;
      line-height: 1.2 !important;
      text-align: center !important;
    }

    .ed-active-carousel-nav,
    .wd-availability-carousel-nav {
      display: grid !important;
      grid-template-columns: 38px minmax(0, 1fr) 38px !important;
      align-items: center !important;
      gap: 8px !important;
      margin: 10px 0 4px !important;
      padding: 7px 8px !important;
      border: 1px solid #dfe7ed !important;
      border-radius: 12px !important;
      background: #fff !important;
    }

    .ed-active-carousel-nav > div,
    .wd-availability-carousel-nav > div {
      min-width: 0 !important;
      text-align: center !important;
    }

    .ed-active-carousel-nav b,
    .wd-availability-carousel-nav b {
      display: block !important;
      color: #102438 !important;
      font-size: 11.5px !important;
      line-height: 1.25 !important;
    }

    .ed-active-carousel-nav span,
    .wd-availability-carousel-nav span {
      display: block !important;
      margin-top: 2px !important;
      color: #7a8996 !important;
      font-size: 10px !important;
      font-weight: 800 !important;
    }

    .ed-active-carousel-nav button,
    .wd-availability-carousel-nav button {
      width: 38px !important;
      height: 38px !important;
      padding: 0 !important;
      border: 1px solid #d7e1e8 !important;
      border-radius: 10px !important;
      background: #fff !important;
      color: #102438 !important;
      font-size: 20px !important;
      line-height: 1 !important;
      font-weight: 900 !important;
    }

    .ed-active-carousel-nav button:disabled,
    .wd-availability-carousel-nav button:disabled {
      opacity: .35 !important;
    }

    .ed-jobs {
      margin-top: 8px !important;
    }

    #worker-availability-editor .wd-days {
      gap: 0 !important;
    }

    #worker-availability-editor .wd-day {
      padding: 11px !important;
      gap: 8px !important;
      border-radius: 14px !important;
    }

    #worker-availability-editor .wd-day-date b {
      font-size: 13px !important;
    }

    #worker-availability-editor .wd-day-date span,
    #worker-availability-editor .wd-availability-choice > span,
    #worker-availability-editor .wd-time-field > span {
      font-size: 10px !important;
    }

    /* Long-term offer details: keep summary dense on phones. */
    .lt-worker-offer-modal .lt-detail-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 7px !important;
    }

    .lt-worker-offer-modal .lt-detail-card {
      min-height: 0 !important;
      padding: 10px !important;
      border-radius: 12px !important;
    }

    .lt-worker-offer-modal .lt-detail-card > span {
      font-size: 10px !important;
      line-height: 1.25 !important;
    }

    .lt-worker-offer-modal .lt-detail-card > b {
      font-size: 13px !important;
      line-height: 1.3 !important;
      overflow-wrap: anywhere !important;
    }

    .lt-worker-offer-modal .lt-detail-card small {
      font-size: 10px !important;
      line-height: 1.3 !important;
    }

    .lt-worker-offer-modal .lt-schedule-row {
      padding: 9px 10px !important;
      gap: 5px !important;
      font-size: 10.5px !important;
    }

    /* Worker priority/stat cards a little shorter. */
    .wd-overview-card {
      min-height: 76px !important;
      padding: 8px 9px !important;
    }

    .wd-kpi {
      min-height: 78px !important;
      padding: 8px 7px !important;
    }
  }

`;




export const mobileModalSafetyStyles = `
  @media (max-width: 760px) {
    :is(
      .account-delete-overlay,
      .admin-chat-overlay,
      .admin-modal-overlay,
      .admin-setup-overlay,
      .admin-team-chat-overlay,
      .ctc-overlay,
      .ed-attendance-overlay,
      .ed-plan-overlay,
      .ed-rating-overlay,
      .ed-saved-overlay,
      .ed-team-overlay,
      .ed-urgent-overlay,
      .lt-chat-overlay,
      .lt-employment-overlay,
      .lt-end-notice-overlay,
      .reliability-modal-overlay,
      .rs-modal-overlay,
      .wd-job-info-overlay
    ) {
      box-sizing: border-box !important;
      padding-top: max(12px, env(safe-area-inset-top)) !important;
      padding-right: 10px !important;
      padding-bottom: max(12px, env(safe-area-inset-bottom)) !important;
      padding-left: 10px !important;
      overflow: hidden !important;
      align-items: center !important;
      justify-items: center !important;
    }

    :is(
      .account-delete-overlay,
      .admin-chat-overlay,
      .admin-modal-overlay,
      .admin-setup-overlay,
      .admin-team-chat-overlay,
      .ctc-overlay,
      .ed-attendance-overlay,
      .ed-plan-overlay,
      .ed-rating-overlay,
      .ed-saved-overlay,
      .ed-team-overlay,
      .ed-urgent-overlay,
      .lt-chat-overlay,
      .lt-employment-overlay,
      .lt-end-notice-overlay,
      .reliability-modal-overlay,
      .rs-modal-overlay,
      .wd-job-info-overlay
    ) > * {
      box-sizing: border-box !important;
      max-width: calc(100vw - 20px) !important;
      max-height: calc(
        100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom)
      ) !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      overscroll-behavior: contain !important;
      -webkit-overflow-scrolling: touch;
    }

    .worker-profile-modal,
    .worker-profile-modal-scroll,
    .reliability-modal,
    .reliability-modal-scroll,
    .lt-employment-modal,
    .lt-chat-card,
    .wd-job-info-modal,
    .admin-modal,
    .admin-setup-card,
    .admin-chat-card,
    .admin-team-chat-card,
    .ctc-modal,
    .ed-attendance-modal,
    .ed-plan-modal,
    .ed-rating-modal,
    .ed-saved-modal,
    .ed-team-modal,
    .ed-urgent-modal,
    .account-delete-modal,
    .lt-end-notice-card,
    .rs-modal-card {
      box-sizing: border-box !important;
    }
  }
`;
