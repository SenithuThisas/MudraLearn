import subprocess
import os

DOT_CLASS = """
digraph ClassDiagram {
    rankdir=TB;
    bgcolor="#ffffff";
    pad=0.2;
    nodesep=0.6;
    ranksep=0.8;
    dpi=300;

    node [fontname="Helvetica", fontsize=10, shape=record, style="filled", fillcolor="#ffffff", color="#334155", penwidth=1.2];
    edge [fontname="Helvetica", fontsize=9, color="#334155", penwidth=1.2, arrowsize=0.85];

    // ================= DOMAIN MODELS =================
    User [fillcolor="#f8fafc", label="{User|+ id: UUID [PK]\\l+ email: String [Unique]\\l+ username: String [Unique]\\l+ password_hash: String\\l+ role: String\\l+ signup_step: String\\l+ failed_login_attempts: int\\l+ locked_until: DateTime\\l}"];

    MasteryScore [fillcolor="#f8fafc", label="{MasteryScore|+ id: Integer [PK]\\l+ user_id: UUID [FK]\\l+ sign_id: String\\l+ score: Float (EWMA)\\l+ attempts: Integer\\l+ tier_unlocked: Integer (1-5)\\l+ last_seen: DateTime\\l}"];

    Progress [fillcolor="#f8fafc", label="{Progress|+ id: Integer [PK]\\l+ user_id: UUID [FK]\\l+ sign_id: String\\l+ category: String\\l+ confidence: Float\\l+ correct: Boolean\\l+ timestamp: DateTime\\l}"];

    UserStreak [fillcolor="#f8fafc", label="{UserStreak|+ user_id: UUID [PK, FK]\\l+ current_streak: Integer\\l+ longest_streak: Integer\\l+ last_active_date: Date\\l}"];

    Batch [fillcolor="#f8fafc", label="{Batch|+ id: Integer [PK]\\l+ tier: Integer\\l+ tier_label: String\\l+ level_number: Integer\\l+ difficulty_rank: Integer\\l+ sign_ids: List[String]\\l}"];

    SignDifficulty [fillcolor="#f8fafc", label="{SignDifficulty|+ sign_id: String [PK]\\l+ batch_id: Integer [FK]\\l+ difficulty_rank: Integer\\l+ f1: Float\\l+ accuracy: Float\\l+ gate_passed: Boolean\\l+ category: String\\l}"];

    UserBatchProgress [fillcolor="#f8fafc", label="{UserBatchProgress|+ id: Integer [PK]\\l+ user_id: UUID [FK]\\l+ batch_id: Integer [FK]\\l+ status: String\\l+ best_score: Integer\\l+ attempts: Integer\\l+ challenge_state: JSONB\\l}"];

    XpLedger [fillcolor="#f8fafc", label="{XpLedger|+ id: Integer [PK]\\l+ user_id: UUID [FK]\\l+ batch_id: Integer [FK]\\l+ amount: Integer\\l+ reason: String\\l+ created_at: DateTime\\l}"];

    // ================= CORE SERVICES =================
    subgraph cluster_services {
        label = "Core Engine & Services";
        fontname = "Helvetica-Bold";
        fontsize = 11;
        color = "#64748b";
        style = "dashed,rounded";
        fillcolor = "#f1f5f9";

        InferenceService [fillcolor="#eff6ff", color="#2563eb", label="{InferenceService|+ load_model(): void\\l+ predict(sequence: 60x126): List[Top3]\\l}"];
        MasteryEngine [fillcolor="#eff6ff", color="#2563eb", label="{MasteryEngine|+ update_mastery(user_id, sign_id, conf, correct): MasteryScore\\l+ get_mastery_summary(user_id): List[Dict]\\l}"];
        AdaptiveEngine [fillcolor="#eff6ff", color="#2563eb", label="{AdaptiveEngine|+ get_next_sign(user_id): Dict\\l- _cold_start(): Dict\\l- _adaptive(): Dict\\l}"];
        PracticeFlowService [fillcolor="#eff6ff", color="#2563eb", label="{PracticeFlowService|+ start_challenge(user_id, batch_id): Dict\\l+ challenge_attempt(user_id, sign_id, sequence): Dict\\l+ use_hint(user_id, batch_id): Dict\\l}"];
    }

    // ================= RELATIONSHIPS =================
    // User Associations (pointing to User)
    Progress -> User [label="0..* : 1", arrowhead="vee"];
    MasteryScore -> User [label="0..* : 1", arrowhead="vee"];
    UserStreak -> User [label="1 : 1", arrowhead="vee"];
    UserBatchProgress -> User [label="0..* : 1", arrowhead="vee"];
    XpLedger -> User [label="0..* : 1", arrowhead="vee"];

    // Batch Associations (pointing to Batch)
    SignDifficulty -> Batch [label="0..* : 1", arrowhead="vee"];
    UserBatchProgress -> Batch [label="0..* : 1", arrowhead="vee"];
    XpLedger -> Batch [label="0..* : 0..1", arrowhead="vee"];

    // Service Dependencies
    PracticeFlowService -> InferenceService [style="dashed", color="#2563eb", label="uses", arrowhead="vee"];
    PracticeFlowService -> MasteryEngine [style="dashed", color="#2563eb", label="updates", arrowhead="vee"];
    AdaptiveEngine -> MasteryScore [style="dashed", color="#2563eb", label="reads", arrowhead="vee"];
    MasteryEngine -> MasteryScore [style="dashed", color="#2563eb", label="updates", arrowhead="vee"];
}
"""

DOT_ACTIVITY = """
digraph ActivityDiagram {
    fontname="Helvetica";
    fontsize=10;
    bgcolor="#ffffff";
    pad=0.4;
    nodesep=0.5;
    ranksep=0.6;
    dpi=300;

    node [fontname="Helvetica", fontsize=10, shape=box, style="filled,rounded", fillcolor="#f8fafc", color="#334155", penwidth=1.2];
    edge [fontname="Helvetica", fontsize=9, color="#334155", penwidth=1.2, arrowsize=0.8];

    // Nodes
    start [shape=circle, width=0.3, height=0.3, style=filled, fillcolor="#0f172a", label=""];
    open_app [label="Learner initiates Practice or Challenge"];
    get_sign [label="Select Target Sign\\n(Adaptive Engine or Batch Sequence)"];
    start_cam [label="Start Webcam & MediaPipe Hands Tracker"];
    buffer_frames [label="Record 60 Frames &\\nExtract 126 Normalized Landmarks"];
    post_predict [label="POST /api/predict or /challenge/attempt\\n(Send 60x126 Frame Sequence)"];
    
    validate [shape=diamond, style=filled, fillcolor="#fef3c7", color="#d97706", label="Payload Valid?\\n(60x126 Shape)"];
    err_resp [fillcolor="#fee2e2", color="#dc2626", label="Return 400 Bad Request"];
    
    run_ml [fillcolor="#eff6ff", color="#2563eb", label="TensorFlow ML Inference\\n(Softmax Probabilities & Top-3 Signs)"];
    
    check_match [shape=diamond, style=filled, fillcolor="#fef3c7", color="#d97706", label="Top Sign == Target\\nAND Conf >= 0.60?"];
    
    match_yes [label="Mark Attempt: Correct (True)\\nDetermine Verdict: 'great' / 'okay'"];
    match_no [label="Mark Attempt: Incorrect (False)\\nDetermine Verdict: 'retry'"];
    
    is_freeform [shape=diamond, style=filled, fillcolor="#fef3c7", color="#d97706", label="Free-Form / Translate\\nMode?"];
    
    skip_db [label="Skip Database Logging"];
    
    log_progress [label="Insert Row into Progress Table"];
    calc_ewma [label="Update MasteryScore with EWMA:\\nScore = 0.3*(Attempt) + 0.7*(OldScore)"];
    
    check_tier [shape=diamond, style=filled, fillcolor="#fef3c7", color="#d97706", label="Score >= 0.80 AND\\nAttempts >= 5?"];
    inc_tier [label="Promote Sign Mastery Tier\\n(tier_unlocked = min(tier+1, 5))"];
    
    award_xp [label="Award XP & Update User Streak"];
    commit_db [label="Commit Database Transaction"];
    return_feedback [label="Display Real-Time Feedback &\\nConfidence to User"];
    
    end_node [shape=doublecircle, width=0.3, height=0.3, style=filled, fillcolor="#0f172a", label=""];

    // Flow
    start -> open_app;
    open_app -> get_sign;
    get_sign -> start_cam;
    start_cam -> buffer_frames;
    buffer_frames -> post_predict;
    post_predict -> validate;
    
    validate -> err_resp [label="[No]"];
    validate -> run_ml [label="[Yes]"];
    
    run_ml -> check_match;
    check_match -> match_yes [label="[Match >= 0.60]"];
    check_match -> match_no [label="[Otherwise]"];
    
    match_yes -> is_freeform;
    match_no -> is_freeform;
    
    is_freeform -> skip_db [label="[Yes]"];
    is_freeform -> log_progress [label="[No]"];
    
    log_progress -> calc_ewma;
    calc_ewma -> check_tier;
    
    check_tier -> inc_tier [label="[Yes]"];
    check_tier -> award_xp [label="[No]"];
    inc_tier -> award_xp;
    
    award_xp -> commit_db;
    commit_db -> return_feedback;
    skip_db -> return_feedback;
    
    err_resp -> end_node;
    return_feedback -> end_node;
}
"""

DOT_USECASE = """
digraph UseCaseDiagram {
    rankdir=LR;
    fontname="Helvetica";
    fontsize=10;
    bgcolor="#ffffff";
    pad=0.3;
    nodesep=0.35;
    ranksep=0.7;
    dpi=300;

    node [fontname="Helvetica", fontsize=10];
    edge [fontname="Helvetica", fontsize=9, color="#475569", penwidth=1.1, arrowsize=0.8];

    // Actors
    Guest [shape=box, style="filled,rounded", fillcolor="#f1f5f9", color="#475569", label="Guest User\\n(Unauthenticated)"];
    Learner [shape=box, style="filled,rounded", fillcolor="#dbeafe", color="#2563eb", label="Registered Learner\\n(Authenticated)"];
    SystemAI [shape=box, style="filled,rounded", fillcolor="#fef3c7", color="#d97706", label="ML & Vision Engine\\n(MediaPipe + Keras)"];

    // System Boundary
    subgraph cluster_system {
        label = "MudraLearn System";
        fontname = "Helvetica-Bold";
        fontsize = 12;
        color = "#334155";
        style = "rounded";
        fillcolor = "#fafafa";
        penwidth = 1.3;

        node [shape=ellipse, style="filled", fillcolor="#ffffff", color="#0284c7", penwidth=1.2];
        
        UC_CheckEmail [label="Check Email Availability"];
        UC_VerifyOTP [label="Verify Email with OTP"];
        UC_Register [label="Register & Complete Profile"];
        UC_Login [label="Login & Authentication"];
        
        UC_AdaptivePractice [label="Practice Signs (Adaptive Mode)"];
        UC_BatchChallenge [label="Attempt Batch Challenge"];
        UC_UseHint [label="Request Dynamic Hint"];
        UC_Translate [label="Real-time Sign Translation"];
        
        UC_ViewMap [label="View Learning Journey Map"];
        UC_TrackMastery [label="Track Mastery, XP & Streaks"];
        UC_ReviewWeak [label="Review Difficult Signs"];

        UC_ExtractLandmarks [fillcolor="#fef9c3", color="#d97706", label="Extract Hand Landmarks (MediaPipe)"];
        UC_InferGesture [fillcolor="#fef9c3", color="#d97706", label="Classify Gesture Sequence (TensorFlow)"];
    }

    // Guest associations
    Guest -> UC_CheckEmail;
    Guest -> UC_Register;
    Guest -> UC_Login;

    // Learner associations
    Learner -> UC_Login;
    Learner -> UC_AdaptivePractice;
    Learner -> UC_BatchChallenge;
    Learner -> UC_Translate;
    Learner -> UC_ViewMap;
    Learner -> UC_TrackMastery;
    Learner -> UC_ReviewWeak;

    // AI Engine associations
    UC_ExtractLandmarks -> SystemAI;
    UC_InferGesture -> SystemAI;

    // Include / Extend relationships
    UC_Register -> UC_VerifyOTP [style="dashed", arrowhead="open", label="<<include>>"];
    UC_AdaptivePractice -> UC_ExtractLandmarks [style="dashed", arrowhead="open", label="<<include>>"];
    UC_AdaptivePractice -> UC_InferGesture [style="dashed", arrowhead="open", label="<<include>>"];
    UC_BatchChallenge -> UC_InferGesture [style="dashed", arrowhead="open", label="<<include>>"];
    UC_Translate -> UC_InferGesture [style="dashed", arrowhead="open", label="<<include>>"];
    UC_UseHint -> UC_BatchChallenge [style="dashed", arrowhead="open", label="<<extend>>"];
}
"""

with open("docs/diagrams/class_diagram.dot", "w") as f:
    f.write(DOT_CLASS)

with open("docs/diagrams/activity_diagram.dot", "w") as f:
    f.write(DOT_ACTIVITY)

with open("docs/diagrams/usecase_diagram.dot", "w") as f:
    f.write(DOT_USECASE)

print("Wrote .dot files. Rendering PNGs with dot...")
subprocess.run(["/opt/homebrew/bin/dot", "-Tpng", "-Gdpi=300", "docs/diagrams/class_diagram.dot", "-o", "docs/diagrams/class_diagram.png"], check=True)
subprocess.run(["/opt/homebrew/bin/dot", "-Tpng", "-Gdpi=300", "docs/diagrams/activity_diagram.dot", "-o", "docs/diagrams/activity_diagram.png"], check=True)
subprocess.run(["/opt/homebrew/bin/dot", "-Tpng", "-Gdpi=300", "docs/diagrams/usecase_diagram.dot", "-o", "docs/diagrams/usecase_diagram.png"], check=True)

print("Generated all 3 PNG diagrams in docs/diagrams/")
