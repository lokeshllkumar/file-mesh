package webrtc

import (
	"encoding/json"
	"fmt"
)

type SignallingPayload struct {
	SDP       *SDPMessage   `json:"sdp,omitempty`
	Candidate *ICECandidate `json:"candidate,omitempty"`
	Type      string        `json:"type"`
}

type SDPMessage struct {
	Type string `json:"type"`
	SDP  string `json:"sdp"`
}

type ICECandidate struct {
	Candidate     string `json:"candidate"`
	SdpMid        string `json:"sdpMid"`
	SdpMLineIndex int    `json:"sdpMLineIndex"`
}

func ParseSignallingPayload(raw json.RawMessage) (*SignallingPayload, error) {
	var payload SignallingPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, fmt.Errorf("invalid signalling payload: %v", err)
	}
	return &payload, nil
}
