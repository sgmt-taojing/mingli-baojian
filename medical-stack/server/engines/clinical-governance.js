'use strict';
// Pure boundary checks shared by publication, retrieval and offline validation.
const PRIVATE_KEYS = new Set(['patient_id','patient_name','name','phone','birth','birthday','id_card','identity','image','image_path','face_embedding','complaint','chief_complaint','doctor_name']);
const CULTURE = /紫微|八字命理|风水|陽宅|阳宅|阴宅|占卜|命宫|命盤|命盘|运势|四化|天纪/;
function containsPrivate(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([k,v]) => PRIVATE_KEYS.has(k) || containsPrivate(v));
}
function publicationCheck(entry) {
  if (!entry || typeof entry !== 'object') return {ok:false,error:'invalid_entry'};
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(entry.id || '')) return {ok:false,error:'invalid_id'};
  if (containsPrivate(entry)) return {ok:false,error:'private_fields_require_deidentification'};
  if (CULTURE.test([entry.title,entry.content,entry.module,entry.syndrome].join(' '))) return {ok:false,error:'non_medical_domain'};
  const g = entry.governance || {};
  if (g.domain !== 'medical' || g.deidentified !== true || g.rights_verified !== true || g.evidence_verified !== true || !g.reviewer_id || !g.reviewed_at) return {ok:false,error:'independent_knowledge_review_required'};
  if (!Array.isArray(entry.evidence) || !entry.evidence.length || entry.evidence.some(e => !e.source_id || !e.locator || !e.version)) return {ok:false,error:'versioned_evidence_required'};
  return {ok:true};
}
function usableFormal(entry) {
  return entry?.status === 'formal' && publicationCheck(entry).ok;
}
module.exports = {publicationCheck,usableFormal,containsPrivate,CULTURE};
