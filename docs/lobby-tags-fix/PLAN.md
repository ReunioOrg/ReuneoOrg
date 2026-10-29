# lobby-tags-fix: implementation plan (PLAN ONLY, no feature code)
Branch: `lobby-tags-fix`, cut from main `4f1ed23` (Oct 14, 2026). Frontend only. File: `project/src/core/lobby/lobby.jsx` (2270 lines, line numbers below are for main 4f1ed23), a new `TagPickerModal` (+ CSS using tokens), one shared tag-selection module. Do not touch the timer, header layout or other restyle work. Julian approves this plan before any build. After the build, Claude diffs the branch against main and reviews it against this spec before Julian merges. No push to main, no merge by the agent.

Julian's decisions (Oct 28): create this branch and commit only this plan doc; the "Edit matching" pill follows the mockup (below the player card on the paired screen); remove the inline tag editor entirely; base is main 4f1ed23; waiting-screen pill placement is NOT approved yet (open question); frontend only for now.

## 1. Behavior
**Required mode.** Opens when ALL are true: the first real `/lobby` poll has arrived (`eligibleForPairing` starts as `useState(false)` at L100, so without a "poll received" ref it would flash), `requires_tags === true`, `eligible_for_pairing === false`, the tutorial is closed, and the sound prompt is not showing (reuse the exact L2052 condition). Only Finish closes it. The poll never closes it. `{status:'inactive'}` and `{status:'lobby_full'}` never open or close it (they already return early).
**Edit mode.** Opened by the "Edit matching" pill. Prefilled with the player's current server tags. An X closes it and discards changes. Finish saves.
**Layout.** Bottom sheet, progress bar, Step 1 "Who are you?", Step 2 "Who do you want to meet?", Back, sticky Finish with a count out of 5. Finish is disabled until both sides have at least 1 tag. One POST, on Finish only. Step 1 never POSTs (today handleContinue L940 posts an empty desiring list).
**Scroll lock.** `position:fixed` with saved `scrollY` (iOS Safari ignores `overflow:hidden`), released on close and on unmount. Copy the App.jsx L387-422 pattern.
**z-index.** About 1200: above the tutorial/countdown (1000) and sound prompt/profile modal (1100), below the checkmark and It's a Match (9999).
**Removed inside the modal:** TagsPhaseIntroOverlay (step headers replace it). The demo hint "Select tags to see how pairing works." (L1986-1988, L2002-2004) moves into the modal, demo only.

## 2. Saving and poll guard
- `POST /set_profile_info` with `{tags_work, tags_desiring_work}` (backend core/views/auth.py 1017-1043). Success: 200 and no `error` key. Failures: 200 `{error:"Player not found"}`; 401 `{detail}` (session expired: go to `/signup?redirect=lobby&code=<code>`, like the auth effect L114-125); 500; or a network error where `response.json()` throws. On any failure: stay in the modal, inline error, no checkmark.
- The poll returns `player_tags.desiring_tags_work` but the POST sends `tags_desiring_work`. Keep the mapping in one place in the shared module.
- Backend validates nothing, so the client enforces max 5 per side and neither side empty. Fix the `handleTagChange` bug (L893): the limit is checked against `null` on first tap (null = use the server value), so a 6th tag can slip through. The shared module loads the server tags before the limit check.
- Poll guard goes INSIDE `fetchLobbyData` (called from 5 places: 5s interval, lobbyState effect L834, visibility change L848, timer onComplete, demo 1s interval). Stamp each call with a sequence number; ignore `eligible_for_pairing` from any response whose request started before the last save resolved. Reopen required mode only if a poll that started after the save says ineligible. `fetchLobbyData` runs in a stale closure, so any modal state it reads is a ref. After a successful save, treat the player as eligible immediately (no 10s re-check) and call `fetchLobbyData()` right away.

## 3. Checkmark (UserIsReadyAnimation)
- `user_is_ready_animation.jsx` stays untouched (it also powers the demo fastForward and hostReturn popups).
- Order: save succeeds -> modal closes -> checkmark plays. Required mode keeps the defaults ("You're ready!" / "You will be paired up soon."). Edit mode passes `mainText` "Tags saved" and `subText` "Your new tags count from your next pairing."
- `onAnimationEnd` (L2097-2106): keep `setShowReadyAnimation(false)` and the `isReadyAnimating` reset; remove `window.scrollTo(top)` and the `setServerselfTags/setServerdesiringTags` overwrite (it can clobber a newer poll).
- Remove dead `tagsCompleted` state (L74, L967).
- Collision: the checkmark and ShowMatchAnimation are both z 9999 and the backend's 1s scan can pair a player right after they finish, so It's a Match can fire during the checkmark in any lobby. Queue the match overlay and the demo DemoFindPersonPopup (z 10000) until the checkmark's `onAnimationEnd`.

## 4. "Edit matching" pill
Follow Julian's mockup (`/workspace/uploads/edit-matching-mockup.png`): on the paired screen the pill sits centered BELOW the player card and its name button (about 16px under it). Style: white pill, 1.5px `--color-gray-200` border, 36px tall, 16px horizontal padding, 8px gap, label "Edit matching" 14px/600 `--text-primary`, adjustments-horizontal (sliders) icon in `--accent-dark` before the label. Use tokens from `styles/tokens.css`, not hex. Show only when `requires_tags` is true, lobby state is checkin, active or interrim, and the modal is closed. Tapping it opens the modal in Edit mode. Nothing else on the page changes.
**OPEN QUESTION (not approved): waiting-screen placement** (no player card; the Oct 18 feedback said directly under the photo is too high). Proposed to confirm with Julian: same relative spot, below the lobby avatars, or pinned near the bottom. Do not build a waiting-screen placement until he picks one.
Note: the written brief said "directly above the I am / Looking for summary", but in the mockup the summary sits above the card, so the mockup wins per Julian.

## 5. Everything removed or changed (line numbers on main 4f1ed23)
**Remove**
- Inline tag form JSX, L1944-2030 (including the step tabs L1962-1981, `.tags-section.focused` class L1955, the `.tags-focus-overlay` div L1938).
- `handleContinue` (L935-956), `handleSave` (L958-974), `handleBack` (L976), `selectionPhase`, `continueButtonRef`, `desiringTagsRef`, `triggerPhaseIntro` + `TagsPhaseIntroOverlay`, and the tag-limit scroll in `handleTagChange` (L904-916). The 5-tag limit warning moves into the modal.
- "Complete Interests" button (L1652-1661) and CSS `.missing-tags-button` (lobby.css L415-440).
- Tags focus overlay: `showTagsFocusOverlay` state, `setShowTagsFocusOverlay`, CSS lobby.css L201-217.
- All auto-scroll: `logTagScroll` + `[TAG-SCROLL]` logs (L43-58), refs `tagAutoScrollDoneRef`/`tagScrollTimerRef`/`prevShowTutorialRef` (L66-68), `scrollToTagsSection` (L997-1029), `tryScrollToTags` (L1333-1373), the eligible reset effect (L1375-1383), the auto-scroll-when-ineligible effect (L1385-1388), the tutorial-closed 350ms retry (L1458-1469), the scroll/prep timer cleanup (L1471-1476; keep the phaseIntro cleanup only if still needed).
- Demo prep system: `showDemoTagPrepOverlay`, `demoTagPrepCompleteRef`, settle/fallback timers, `dismissDemoTagPrepAndScroll`, the 1s fast-poll effect, layout-stable effect, 3s fallback (L94-98, 1031-1044, 1390-1456), overlay JSX (L2046-2050), CSS (lobby.css ~L246-260), constants L33-35, `demoTagPrepCompleteRef` lines in `handleTutorialComplete` (L1092-1099).
- Layout-debug `useLayoutEffect` (HEIGHT_SHIFT, ~L1148-1330) if it references removed state; trim or delete (demo-only debug).
- Dead `tagsCompleted` (L74, L967).
**Change**
- Header (L1652-1661 area): replace the tag-count condition with `requires_tags && !eligibleForPairing` (after first poll) and show "You're not ready yet. Finish your interests." with no button.
- Countdown hide (L2055 area): same eligibility condition.
- `onAnimationEnd` (L2097-2106) as in section 3.
- `fetchLobbyData`: add sequence-number guard and refs; stop trusting `eligible_for_pairing` from pre-save responses; call it after a successful save.
- Match overlay / demo popup triggers (L660-681, L710-716, ShowMatchAnimation sites): queue behind the checkmark.
- `handleTagChange` (L893-933): move to the shared module; fix the null-limit bug.
- Keep: `custom_tags`/`tagsState` (L513; use `tagsState?.length`, guard `Array.isArray`), `define_profile_info` (L294-308) as the request helper but make it awaited and return success/failure, `MAX_TAGS_ALLOWED` (L31), AnimatedTagList, the "I am / Looking for" summary (selected-tags-container), `handleTutorialComplete` as the hook for opening the modal after the tutorial.
**New**
- `TagPickerModal` component + CSS (tokens), shared tag-selection module (tags state, limit check, validation, request mapping), `useBodyScrollLock`, "Edit matching" pill component, `pollReceivedRef`, `lastSaveSeqRef`/request sequence ref, queued-overlay ref.

## 6. Where I (Reuneo Design 2) disagree or have concerns with the brief
1. Brief part 3d vs part 2 correction: I am treating the rule as "no feature code until Julian says go".
2. Brief part 5 placement "directly above the I am / Looking for summary" conflicts with the mockup. Julian chose the mockup.
3. Brief says "match the 2a header Pause pill" for styling. That header is not on main 4f1ed23. Julian said to ignore it; I will use the token values listed in part 5 instead.
4. Dropping the 10s re-check (brief) removes my earlier safety window. The sequence-number guard covers the post-save race, but a poll that STARTED after the save could still legitimately say ineligible if the server lags; the plan reopens required mode only in that case. Acceptable, but QA must test a slow poll.
5. Removing the inline editor entirely means a player editing tags depends on the modal. If the pill is not visible in some state (terminated lobby, or no tags), they simply cannot edit. That matches the brief.
6. Open waiting-screen pill placement (section 4).
7. Hobbies tags: the backend resets `tags_hobbies` to [] on every save. I need to grep the frontend to confirm nothing uses them before build (part 5 item).
8. The "Edit matching" label spells lowercase "matching" per brief; the earlier name was "Edit How You Get Matched" (Julian renamed it).

## 7. Test plan (after Julian's go)
Real and demo lobbies; first visit with tutorial and repeat visit; mobile sizes (390x844 and a small Android size); required mode with 0 tags; edit mode prefill, X discard, Finish; empty side blocked; failed save (401, 200 error, network); server says ineligible after save; poll mid-save; match overlay arriving during the checkmark; demo fast-forward timers; random-pairing lobby (no tags, no modal/no pill); screenshots only after the It's a Match overlay is gone.

No feature code has been written.
