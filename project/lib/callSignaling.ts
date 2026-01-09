import { supabase } from './supabase';
import type { CallType } from './webrtc';
import { RTCSessionDescription, RTCIceCandidate } from 'react-native-webrtc';

export type CallStatus = 'ringing' | 'accepted' | 'rejected' | 'ended' | 'missed';

export interface CallSignal {
    id: string;
    conversation_id: string;
    caller_id: string;
    callee_id: string;
    call_type: CallType;
    status: CallStatus;
    sdp_offer: string | null;
    sdp_answer: string | null;
    ice_candidates: any[];
    created_at: string;
    ended_at: string | null;
}

export interface CallEventCallback {
    onIncomingCall?: (call: CallSignal) => void;
    onCallAccepted?: (call: CallSignal) => void;
    onCallRejected?: (call: CallSignal) => void;
    onCallEnded?: (call: CallSignal) => void;
    onIceCandidateReceived?: (callId: string, candidate: any) => void;
    onAnswerReceived?: (callId: string, answer: string) => void;
}

/**
 * Initiate a new call
 */
export async function initiateCall(
    conversationId: string,
    callerId: string,
    calleeId: string,
    callType: CallType,
    sdpOffer: RTCSessionDescription
): Promise<CallSignal | null> {
    const { data, error } = await supabase
        .from('call_signaling')
        .insert({
            conversation_id: conversationId,
            caller_id: callerId,
            callee_id: calleeId,
            call_type: callType,
            status: 'ringing',
            sdp_offer: JSON.stringify(sdpOffer),
            ice_candidates: [],
        })
        .select()
        .single();

    if (error) {
        console.error('[initiateCall] Error:', error);
        return null;
    }

    return data as CallSignal;
}

/**
 * Accept an incoming call
 */
export async function acceptCall(
    callId: string,
    sdpAnswer: RTCSessionDescription
): Promise<boolean> {
    const { error } = await supabase
        .from('call_signaling')
        .update({
            status: 'accepted',
            sdp_answer: JSON.stringify(sdpAnswer),
        })
        .eq('id', callId);

    if (error) {
        console.error('[acceptCall] Error:', error);
        return false;
    }

    return true;
}

/**
 * Reject an incoming call
 */
export async function rejectCall(callId: string): Promise<boolean> {
    const { error } = await supabase
        .from('call_signaling')
        .update({
            status: 'rejected',
            ended_at: new Date().toISOString(),
        })
        .eq('id', callId);

    if (error) {
        console.error('[rejectCall] Error:', error);
        return false;
    }

    return true;
}

/**
 * End an active call
 */
export async function endCall(callId: string): Promise<boolean> {
    const { error } = await supabase
        .from('call_signaling')
        .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
        })
        .eq('id', callId);

    if (error) {
        console.error('[endCall] Error:', error);
        return false;
    }

    return true;
}

/**
 * Add ICE candidate to call
 */
export async function addIceCandidateToCall(
    callId: string,
    candidate: RTCIceCandidate
): Promise<boolean> {
    // First get current candidates
    const { data: callData } = await supabase
        .from('call_signaling')
        .select('ice_candidates')
        .eq('id', callId)
        .single();

    const currentCandidates = callData?.ice_candidates || [];

    const { error } = await supabase
        .from('call_signaling')
        .update({
            ice_candidates: [...currentCandidates, candidate],
        })
        .eq('id', callId);

    if (error) {
        console.error('[addIceCandidateToCall] Error:', error);
        return false;
    }

    return true;
}

/**
 * Get active call for a conversation
 */
export async function getActiveCall(conversationId: string): Promise<CallSignal | null> {
    const { data, error } = await supabase
        .from('call_signaling')
        .select('*')
        .eq('conversation_id', conversationId)
        .in('status', ['ringing', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[getActiveCall] Error:', error);
        return null;
    }

    return data as CallSignal | null;
}

/**
 * Subscribe to call events for a user
 */
export function subscribeToCallEvents(
    userId: string,
    callbacks: CallEventCallback
): () => void {
    const channel = supabase
        .channel(`calls:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'call_signaling',
                filter: `callee_id=eq.${userId}`,
            },
            (payload) => {
                const call = payload.new as CallSignal;
                if (call.status === 'ringing') {
                    callbacks.onIncomingCall?.(call);
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'call_signaling',
            },
            (payload) => {
                const call = payload.new as CallSignal;

                // Only process if user is participant
                if (call.caller_id !== userId && call.callee_id !== userId) {
                    return;
                }

                switch (call.status) {
                    case 'accepted':
                        callbacks.onCallAccepted?.(call);
                        if (call.sdp_answer && call.caller_id === userId) {
                            callbacks.onAnswerReceived?.(call.id, call.sdp_answer);
                        }
                        break;
                    case 'rejected':
                        callbacks.onCallRejected?.(call);
                        break;
                    case 'ended':
                    case 'missed':
                        callbacks.onCallEnded?.(call);
                        break;
                }

                // Check for new ICE candidates
                const oldCandidates = (payload.old as CallSignal)?.ice_candidates || [];
                const newCandidates = call.ice_candidates || [];

                if (newCandidates.length > oldCandidates.length) {
                    const addedCandidates = newCandidates.slice(oldCandidates.length);
                    addedCandidates.forEach((candidate) => {
                        callbacks.onIceCandidateReceived?.(call.id, candidate);
                    });
                }
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Mark call as missed (timeout)
 */
export async function markCallAsMissed(callId: string): Promise<boolean> {
    const { error } = await supabase
        .from('call_signaling')
        .update({
            status: 'missed',
            ended_at: new Date().toISOString(),
        })
        .eq('id', callId)
        .eq('status', 'ringing'); // Only update if still ringing

    if (error) {
        console.error('[markCallAsMissed] Error:', error);
        return false;
    }

    return true;
}
