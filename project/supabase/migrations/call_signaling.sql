-- WebRTC Call Signaling Table for Defcom
-- Run this migration in your Supabase SQL editor

-- Create the call_signaling table
CREATE TABLE IF NOT EXISTS call_signaling (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES profiles(id),
  callee_id UUID REFERENCES profiles(id),
  call_type TEXT CHECK (call_type IN ('audio', 'video')),
  status TEXT CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended', 'missed')),
  sdp_offer TEXT,
  sdp_answer TEXT,
  ice_candidates JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_signaling_conversation ON call_signaling(conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_signaling_caller ON call_signaling(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_signaling_callee ON call_signaling(callee_id);
CREATE INDEX IF NOT EXISTS idx_call_signaling_status ON call_signaling(status);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE call_signaling;

-- Enable Row Level Security
ALTER TABLE call_signaling ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can see calls where they are caller or callee
CREATE POLICY "Users can see their own calls" ON call_signaling
  FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can create calls (as caller)
CREATE POLICY "Users can create calls" ON call_signaling
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

-- Participants can update calls
CREATE POLICY "Participants can update calls" ON call_signaling
  FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Participants can delete calls
CREATE POLICY "Participants can delete calls" ON call_signaling
  FOR DELETE USING (auth.uid() = caller_id OR auth.uid() = callee_id);
