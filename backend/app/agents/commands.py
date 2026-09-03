"""
Deterministic command grammar for cart and order operations.

Why not just extend the LLM router prompt
-----------------------------------------
Discovery ("find me pink running shoes") is open-ended and genuinely needs a
language model.  Cart and order operations are the opposite: a closed set of
about seven verbs over a numbered list the agent itself just rendered.  For that
shape a grammar beats a model on every axis that matters here --

  * **Reliability.**  "Increase the quantity" classified as a product search is
    a broken conversation.  A regex either matches or does not; it cannot be
    talked out of it by surrounding chit-chat.
  * **Latency and cost.**  These turns resolve with no network call at all.
  * **Explainability.**  The audit ledger records the pattern name that fired,
    so "why did the agent change my cart" has a literal answer.  That is the
    project's bar: every money action explainable.

The parser is deliberately conservative.  It claims a turn only when it is
certain, and returns None otherwise so the LLM router still handles everything
open-ended.  In particular a mutation is only claimed when the message contains
an actual referring expression -- "add the first one to my bag" is a command,
but "add running shoes to my bag" is a *search* that happens to use the word
add, and is left to the router (which shows shoes, after which "add the first
one" works).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

# ── Intents this module can produce ─────────────────────────────────────────

VIEW_CART = "view_cart"
VIEW_ORDERS = "view_orders"
CART_ADD = "cart_add"
CART_UPDATE_QTY = "cart_update_qty"
CART_REMOVE = "cart_remove"
CART_CLEAR = "cart_clear"
OPEN_ITEM = "open_item"
CONFIRM = "confirm"
DENY = "deny"

#: Intents routed to `cart_ops_node`.  `graph.py` imports this rather than
#: repeating the list, so adding an intent here wires it up in one place.
CART_OPS_INTENTS = frozenset({
    VIEW_CART, VIEW_ORDERS, CART_ADD, CART_UPDATE_QTY,
    CART_REMOVE, CART_CLEAR, OPEN_ITEM, CONFIRM, DENY,
})


@dataclass
class ParsedCommand:
    intent: str
    pattern: str                                  # which rule fired, for the audit trail
    qty_mode: Optional[str] = None                # "delta" | "set"
    qty_value: Optional[int] = None
    slots: Dict[str, Any] = field(default_factory=dict)


# ── Vocabulary ──────────────────────────────────────────────────────────────

_CART_NOUN = r"(?:cart|bag|basket|trolley)"
_ORDER_NOUN = r"(?:orders?|purchases?|order\s+history|past\s+orders?|previous\s+orders?)"

# A referring expression: an ordinal, a positional cue, a pronoun, or "all".
# `\d{1,2}` is only an ordinal behind an explicit cue (#2, item 2, number 2) --
# see reference.py for why a bare numeral must not be read as a position.
_REFERRING = re.compile(
    r"\b(?:first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|sixth|6th"
    r"|seventh|7th|eighth|8th|ninth|9th|tenth|10th|last|final)\b"
    r"|(?:#|\bno\.?\s*|\bnumber\s+|\boption\s+|\bitem\s+)\d{1,2}\b"
    r"|\b(?:that|this|it|the)\s+(?:one|item|product|order)\b"
    # "the Nike one", "the black leather one" -- a description standing in for a
    # position. Bounded to two intervening words so it cannot swallow a sentence.
    r"|\bthe\s+\w+(?:\s+\w+)?\s+(?:one|ones|item)\b"
    r"|\b(?:all|everything|both)\b"
    r"|\b(?:again|re-?order)\b",
    re.I,
)

# A bare pronoun as the direct object of an add verb: "add it to my cart",
# "buy that", "put them in my bag".  Kept separate from `_REFERRING` on purpose
# -- a loose bare "that" anywhere in the message would claim sentences like
# "add shoes that are red to my cart", where resolving against the focus list
# would be a guess.  Requiring adjacency to the verb makes it a real reference.
_ADD_PRONOUN = re.compile(
    r"\b(?:add|buy|put|get|grab|take)\s+(?:it|that|this|them|those|these)\b", re.I)

_QTY_NOUN = r"(?:quantity|qty|count|number|amount|units?|pieces?)"

# Quantities accept up to three digits so an absurd request ("make it 999") is
# *parsed and then clamped* by `cart_service.MAX_QTY_PER_LINE` rather than
# failing to match and falling through to the LLM as if it were a search.  The
# bound is the safety property; refusing to read the number is not.  Stopping at
# three digits keeps four-figure rupee amounts ("make it 2000") out of the
# quantity slot, where they are far more likely to mean a price.
_QTY_NUM = r"\d{1,3}"

# ── Rules, checked in order.  Specific verbs before bare nouns. ─────────────

_SET_QTY = re.compile(
    r"\b(?:set|change|update|make)\b[^.]*?\b(?:%s)\b[^.]*?\b(?:to|as|=)\s*(%s)\b" % (_QTY_NOUN, _QTY_NUM), re.I)
_SET_QTY_SHORT = re.compile(r"\b(?:make|set)\s+(?:it|that|this|them)\s+(%s)\b" % _QTY_NUM, re.I)
_INC_QTY_BY = re.compile(
    r"\b(?:increase|increment|raise|bump|up)\b[^.]*?\bby\s+(%s)\b" % _QTY_NUM, re.I)
_DEC_QTY_BY = re.compile(
    r"\b(?:decrease|decrement|reduce|lower|drop)\b[^.]*?\bby\s+(%s)\b" % _QTY_NUM, re.I)
_ADD_N_MORE = re.compile(r"\badd\s+(%s)\s+more\b|\b(%s)\s+more\b" % (_QTY_NUM, _QTY_NUM), re.I)
_ONE_MORE = re.compile(r"\b(?:one|1|another)\s+more\b|\badd\s+another\b", re.I)
_INC_QTY = re.compile(
    r"\b(?:increase|increment|raise|bump)\b(?:[^.]*?\b%s\b)?" % _QTY_NOUN, re.I)
_DEC_QTY = re.compile(
    r"\b(?:decrease|decrement|reduce|lower)\b(?:[^.]*?\b%s\b)?" % _QTY_NOUN, re.I)

_CLEAR_CART = re.compile(
    r"\b(?:empty|clear|wipe|reset|delete\s+all|remove\s+everything)\b[^.]*?\b%s\b"
    r"|\b%s\b[^.]*?\b(?:empty|clear)\b" % (_CART_NOUN, _CART_NOUN), re.I)
_REMOVE = re.compile(
    r"\b(?:remove|delete|drop|discard|take\s+out|get\s+rid\s+of|take\s+off)\b", re.I)

_REORDER = re.compile(
    r"\b(?:re-?order|order\s+(?:it|that|this|them)?\s*again|buy\s+(?:it|that|this|them)?\s*again"
    r"|(?:add|put)\b[^.]*?\bagain\b)", re.I)
_ADD_TO_CART = re.compile(
    r"\b(?:add|put|place|throw|toss|chuck)\b[^.]*?\b(?:%s)\b" % _CART_NOUN, re.I)
# "take" is deliberately absent: it collides with "take me to the second one"
# (navigation) and with "take out"/"take off" (removal), and add/buy already
# cover the intent.
_ADD_BARE = re.compile(r"^\s*(?:add|buy)\b", re.I)

_VIEW_CART = re.compile(
    r"\b(?:show|view|see|open|display|what(?:'s|\s+is)?\s+in|check|list|whats)\b[^.]*?\b%s\b"
    r"|^\s*(?:my\s+)?%s\s*\??\s*$" % (_CART_NOUN, _CART_NOUN), re.I)
_VIEW_ORDERS = re.compile(
    r"\b(?:show|view|see|open|display|what(?:'s|\s+are)?|check|list|whats|my|past|previous|recent)\b"
    r"[^.]*?\b%s\b" % _ORDER_NOUN, re.I)

_OPEN_ITEM = re.compile(
    r"\b(?:open|show|view|see|display|details?\s+(?:of|for)|tell\s+me\s+(?:more\s+)?about"
    r"|take\s+me\s+to|go\s+to)\b", re.I)


def _qty(text: str) -> Optional[ParsedCommand]:
    """Quantity mutations, most specific phrasing first."""
    m = _SET_QTY.search(text) or _SET_QTY_SHORT.search(text)
    if m:
        return ParsedCommand(CART_UPDATE_QTY, "set_quantity", "set", int(m.group(1)))

    m = _INC_QTY_BY.search(text)
    if m:
        return ParsedCommand(CART_UPDATE_QTY, "increase_by", "delta", int(m.group(1)))

    m = _DEC_QTY_BY.search(text)
    if m:
        return ParsedCommand(CART_UPDATE_QTY, "decrease_by", "delta", -int(m.group(1)))

    m = _ADD_N_MORE.search(text)
    if m:
        n = int(m.group(1) or m.group(2))
        return ParsedCommand(CART_UPDATE_QTY, "add_n_more", "delta", n)

    if _ONE_MORE.search(text):
        return ParsedCommand(CART_UPDATE_QTY, "one_more", "delta", 1)

    # Bare "increase the quantity" / "reduce it".  Requires the quantity noun or
    # a referring expression, so "reduce the price" is not caught.
    if _INC_QTY.search(text) and (re.search(_QTY_NOUN, text, re.I) or _REFERRING.search(text)):
        return ParsedCommand(CART_UPDATE_QTY, "increase", "delta", 1)
    if _DEC_QTY.search(text) and (re.search(_QTY_NOUN, text, re.I) or _REFERRING.search(text)):
        return ParsedCommand(CART_UPDATE_QTY, "decrease", "delta", -1)
    return None


def parse_command(text: str, *, has_pending: bool = False) -> Optional[ParsedCommand]:
    """
    Classify `text` as a cart/order command, or None to defer to the LLM router.

    `has_pending` must be True when the session is holding an action awaiting
    confirmation; a bare "yes" is only a command in that context, and reading it
    as one otherwise would be an invented approval.
    """
    text = (text or "").strip()
    if not text:
        return None

    # 0. Answering a gate.  Only valid while something is actually pending.
    if has_pending:
        from .reference import read_confirmation

        verdict = read_confirmation(text)
        if verdict is True:
            return ParsedCommand(CONFIRM, "confirmation_yes")
        if verdict is False:
            return ParsedCommand(DENY, "confirmation_no")

    referring = bool(_REFERRING.search(text))
    # A pronoun object of an add verb counts as a reference for add/remove, and
    # resolves through the session's last-acted-on item.
    pronoun_add = bool(_ADD_PRONOUN.search(text))

    # 1. Quantity changes.  Before generic add/remove so "add 2 more" is a
    #    quantity bump on an existing line, not a second line item.
    qty = _qty(text)
    if qty is not None:
        return qty

    # 2. Clearing the whole cart -- checked before the generic remove verb.
    if _CLEAR_CART.search(text):
        return ParsedCommand(CART_CLEAR, "clear_cart")

    # 3. Removal, which needs something to remove.
    if _REMOVE.search(text) and referring:
        return ParsedCommand(CART_REMOVE, "remove_referenced")

    # 4. Reorder -- "put the 2nd one in cart again", "buy that again".
    if _REORDER.search(text):
        return ParsedCommand(CART_ADD, "reorder", slots={"reorder": True})

    # 5. Add to cart.  Only with a referring expression, so "add running shoes
    #    to my bag" stays a search (see the module docstring).
    if (_ADD_TO_CART.search(text) or _ADD_BARE.match(text)) and (referring or pronoun_add):
        return ParsedCommand(CART_ADD, "add_pronoun" if pronoun_add and not referring
                                       else "add_referenced")

    # 6. Read-only listings.
    if _VIEW_ORDERS.search(text):
        return ParsedCommand(VIEW_ORDERS, "view_orders")
    if _VIEW_CART.search(text):
        return ParsedCommand(VIEW_CART, "view_cart")

    # 7. "Open the first one".  Last, because open/show also appear in the
    #    listing patterns above, which are more specific.
    if _OPEN_ITEM.search(text) and referring:
        return ParsedCommand(OPEN_ITEM, "open_referenced")

    return None
