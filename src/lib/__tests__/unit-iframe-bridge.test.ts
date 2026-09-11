/**
 * Unit Test Suite for Bidirectional Iframe Bridge (ADR 0006)
 * Verifies postMessage parsing, instantaneous Governor dispatch,
 * and outbound message payload contracts.
 */

import assert from 'assert';
import { InterestController } from '../interestController';

export function runIframeBridgeTestSuite() {
  console.log("--- STARTING BIDIRECTIONAL IFRAME BRIDGE (ADR 0006) TEST SUITE ---");

  // Mock Iframe Window to intercept outbound postMessages
  const outboundMessages: Array<{ message: any; targetOrigin: string }> = [];
  const mockIframeWindow = {
    postMessage: (message: any, targetOrigin: string) => {
      outboundMessages.push({ message, targetOrigin });
    }
  };

  const governor = new InterestController(50.0);

  // Dispatch function simulating useTavusSession edge dispatch
  const dispatchIframeCommand = (physics: { interruptibility: string; patience: string }, emotion: string) => {
    mockIframeWindow.postMessage({
      type: 'conversation.sensitivity',
      properties: {
        interruptibility: physics.interruptibility,
        patience: physics.patience,
      }
    }, '*');

    mockIframeWindow.postMessage({
      type: 'conversation.emotion',
      properties: {
        emotion,
      }
    }, '*');
  };

  // 1. Simulate inbound Perception Tool Call (Nervous Fidgeting Signal)
  const simulatedInboundEvent = {
    data: {
      event_type: 'conversation.perception_tool_call',
      name: 'log_behavioral_signal',
      properties: {
        function_name: 'log_behavioral_signal',
        arguments: {
          signal_id: 'PHY_FIDGET_TOUCH',
          category: 'Physique',
          signal_type: 'negative',
          magnitude: -15,
          reason: 'Excessive face and neck touching under questioning',
        }
      }
    }
  };

  const args = simulatedInboundEvent.data.properties.arguments;
  const startTs = performance.now();
  const step = governor.applySignal({
    signalId: args.signal_id,
    category: args.category,
    signalType: args.signal_type,
    magnitude: args.magnitude,
    reason: args.reason,
  });
  dispatchIframeCommand(step.physics, step.emotion);
  const elapsedMs = performance.now() - startTs;

  // SLA Verification: Total Edge Loop <= 30.0ms (typically < 1ms locally)
  assert(elapsedMs < 10.0, `Edge loop SLA exceeded: ${elapsedMs.toFixed(2)}ms`);

  // Assert Governor calculations
  assert(step.score === 35.0, `Expected score 35.0, got ${step.score}`);
  assert(step.tier === 'LOCKED', `Expected LOCKED tier, got ${step.tier}`);
  assert(step.tierChanged === true, "Expected tier change from SCREENING to LOCKED");
  assert(step.emotion === 'contempt', `Expected contempt emotion, got ${step.emotion}`);

  // Assert Outbound Messages to Iframe Window
  assert(outboundMessages.length === 2, `Expected 2 outbound messages, got ${outboundMessages.length}`);

  // Outbound 1: Physics / Sensitivity
  const msg1 = outboundMessages[0].message;
  assert(msg1.type === 'conversation.sensitivity', `Message 1 type mismatch: ${msg1.type}`);
  assert(msg1.properties.interruptibility === 'low', "Expected low interruptibility in LOCKED");
  assert(msg1.properties.patience === 'high', "Expected high patience in LOCKED");

  // Outbound 2: Emotion Override
  const msg2 = outboundMessages[1].message;
  assert(msg2.type === 'conversation.emotion', `Message 2 type mismatch: ${msg2.type}`);
  assert(msg2.properties.emotion === 'contempt', `Message 2 emotion mismatch: ${msg2.properties.emotion}`);

  // 2. Simulate Positive High-EQ Response (Deflecting Frame)
  outboundMessages.length = 0; // Clear
  const positiveInboundEvent = {
    data: {
      event_type: 'conversation.tool_call',
      name: 'log_behavioral_signal',
      properties: {
        function_name: 'log_behavioral_signal',
        arguments: {
          signal_id: 'EQ_CALM_JAB_DEFLECTION',
          category: 'EQ',
          signal_type: 'positive',
          magnitude: 15,
          reason: 'Playfully defused test with grounded smile',
        }
      }
    }
  };

  const posArgs = positiveInboundEvent.data.properties.arguments;
  const posStep = governor.applySignal({
    signalId: posArgs.signal_id,
    category: posArgs.category,
    signalType: posArgs.signal_type,
    magnitude: posArgs.magnitude,
    reason: posArgs.reason,
  });
  dispatchIframeCommand(posStep.physics, posStep.emotion);

  // Score was 35, +15 -> 50 (>= 45 threshold) -> transitions to SCREENING
  assert(posStep.score === 50.0, `Expected score 50.0, got ${posStep.score}`);
  assert(posStep.tier === 'SCREENING', `Expected SCREENING tier, got ${posStep.tier}`);
  assert(outboundMessages.length === 2, "Expected 2 outbound messages for positive signal");
  assert(outboundMessages[0].message.properties.patience === 'medium', "Expected medium patience in SCREENING");
  assert(outboundMessages[1].message.properties.emotion === 'content', "Expected content emotion from rubric");

  // 3. Robustness: Handle events without explicit magnitude or signal_id
  const legacyInbound = {
    category: 'Physique',
    signal_type: 'negative',
    reason: 'Frequent posture collapse',
  };
  const legacyStep = governor.applySignal(legacyInbound);
  assert(legacyStep.score < 50.0, "Legacy signal without magnitude should resolve rubric delta");
  assert(legacyStep.signalId === 'PHY_POSTURE_COLLAPSE', `Expected rubric resolution to PHY_POSTURE_COLLAPSE, got ${legacyStep.signalId}`);

  console.log(`--- BIDIRECTIONAL IFRAME BRIDGE TESTS PASSED CLEANLY (SLA: ${elapsedMs.toFixed(3)}ms) ---`);
}
