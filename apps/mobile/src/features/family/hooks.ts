import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { allowNotifications } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

import {
  acceptInvite,
  createInvite,
  familyInUse,
  familyKeys,
  fetchFamily,
  fetchGuardianAlerts,
  removeLink,
} from './api';
import { notifyGuardian } from './notify';
import { syncFamilyTask } from './task';

/**
 * Family links. The Family screen always loads them; elsewhere (always = false) only when this
 * phone already uses Family Guardian, so no account is created for people who never use it.
 */
export function useFamily(always = false) {
  return useQuery({
    queryKey: familyKeys.links,
    queryFn: async () => {
      const family = await fetchFamily();
      if (Platform.OS === 'android') await syncFamilyTask(family.lookingAfter.length > 0);
      return family;
    },
    enabled: always || familyInUse(),
    staleTime: 60_000,
  });
}

export function useGuardianAlerts(me: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: familyKeys.alerts,
    queryFn: () => fetchGuardianAlerts(me!),
    enabled: !!me && enabled,
    staleTime: 60_000,
  });
}

export function useCreateInvite() {
  return useMutation({ mutationFn: (name: string) => createInvite(name) });
}

export function useAcceptInvite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ code, name }: { code: string; name: string }) => acceptInvite(code, name),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: familyKeys.all });
      // Guardians are told about scams with a notification.
      await allowNotifications();
    },
  });
}

export function useRemoveLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removeLink(id),
    onSuccess: () => client.invalidateQueries({ queryKey: familyKeys.all }),
  });
}

/**
 * While the app is open, a guardian hears about new alerts straight away (Supabase Realtime only
 * delivers rows that RLS lets this user read). When it is closed, the background task catches up.
 *
 * The channel is rebuilt only when the people being looked after change, not on every refetch
 * (each refetch returns a new array), and every channel gets its own name, so a channel still
 * being removed cannot clash with the new one.
 */
export function useFamilyLive(): void {
  const client = useQueryClient();
  const { data: family } = useFamily();
  const me = family?.me;
  const lookingAfter = family?.lookingAfter;
  const watched = lookingAfter?.map((l) => l.protected_id).join(',') ?? '';
  const linksRef = useRef(lookingAfter ?? []);

  useEffect(() => {
    linksRef.current = lookingAfter ?? [];
  }, [lookingAfter]);

  useEffect(() => {
    if (!me || !watched) return;
    channelCount += 1;
    const channel = supabase
      .channel(`guardian-alerts-${channelCount}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guardian_alerts' },
        () => {
          void fetchGuardianAlerts(me)
            .then((alerts) => {
              client.setQueryData(familyKeys.alerts, alerts);
              notifyGuardian(alerts, linksRef.current);
            })
            .catch((e) => {
              if (__DEV__) console.warn('live family alert failed', e);
            });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [client, me, watched]);
}

let channelCount = 0;
