// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
import type { Role } from './types';

export type Action =
  | 'project.create' | 'project.edit' | 'project.view'
  | 'cost.edit' | 'cost.view'
  | 'scenario.publish' | 'scenario.view'
  | 'access.request' | 'access.respond' | 'access.view.own' | 'access.view.all' | 'access.view.schedule'
  | 'concern.raise' | 'concern.resolve' | 'concern.view.own' | 'concern.view.all'
  | 'decision.record' | 'decision.respond' | 'decision.view.all'
  | 'work.update' | 'work.view'
  | 'doc.upload' | 'doc.view.public' | 'doc.view.internal' | 'doc.view.vendor'
  | 'log.view' | 'members.manage';

/**
 * Matriks izin yang dimaksudkan. Ini ADALAH spesifikasi untuk kebijakan RLS di supabase/migrations;
 * tes memastikan kebijakan basis data selaras dengan matriks ini. Di aplikasi, matriks ini hanya
 * menentukan apa yang ditampilkan; penegakan sesungguhnya ada di basis data.
 */
export const PERMISSIONS: Record<Role, readonly Action[]> = {
  manager: [
    'project.create', 'project.edit', 'project.view', 'cost.edit', 'cost.view', 'scenario.publish', 'scenario.view',
    'access.request', 'access.view.all', 'concern.resolve', 'concern.view.all', 'decision.record', 'decision.view.all',
    'work.update', 'work.view', 'doc.upload', 'doc.view.public', 'doc.view.internal', 'doc.view.vendor', 'log.view', 'members.manage',
  ],
  owner: [
    'project.view', 'cost.view', 'scenario.view', 'access.respond', 'access.view.own', 'concern.raise', 'concern.view.own',
    'decision.respond', 'work.view', 'doc.view.public', 'log.view',
  ],
  resident: [
    'project.view', 'scenario.view', 'access.respond', 'access.view.own', 'concern.raise', 'concern.view.own',
    'work.view', 'doc.view.public', 'log.view',
  ],
  vendor: ['project.view', 'cost.view', 'access.view.schedule', 'work.update', 'work.view', 'doc.view.public', 'doc.view.vendor', 'log.view'],
};

export const can = (role: Role, action: Action): boolean => PERMISSIONS[role].includes(action);
