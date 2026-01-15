from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Text, JSON, Numeric, Enum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from decimal import Decimal
import enum
from .db import Base


class TransactionType(str, enum.Enum):
    """Credit transaction types"""
    RESET = "reset"
    DEDUCT = "deduct"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"


class QuestionType(str, enum.Enum):
    """Form question types"""
    SHORT_ANSWER = "short_answer"
    LONG_ANSWER = "long_answer"
    MULTIPLE_CHOICE = "multiple_choice"
    CHECKBOXES = "checkboxes"
    DROPDOWN = "dropdown"
    MULTI_SELECT = "multi_select"
    NUMBER = "number"
    EMAIL = "email"
    PHONE = "phone"
    LINK = "link"
    FILE_UPLOAD = "file_upload"
    DATE = "date"
    TIME = "time"
    LINEAR_SCALE = "linear_scale"
    MATRIX = "matrix"
    RATING = "rating"
    PAYMENT = "payment"
    SIGNATURE = "signature"
    RANKING = "ranking"
    WALLET_CONNECT = "wallet_connect"


class ConditionType(str, enum.Enum):
    """Conditional logic condition types"""
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"


class SubmissionStatus(str, enum.Enum):
    """Form submission status types"""
    IN_PROGRESS = "in_progress"
    PARTIAL = "partial"
    COMPLETE = "complete"
    ABANDONED = "abandoned"


class AnalyticsEventType(str, enum.Enum):
    """Analytics event types"""
    FORM_VIEWED = "form_viewed"
    FORM_STARTED = "form_started"
    QUESTION_VIEWED = "question_viewed"
    QUESTION_ANSWERED = "question_answered"
    QUESTION_SKIPPED = "question_skipped"
    FORM_ABANDONED = "form_abandoned"
    FORM_SUBMITTED_PARTIAL = "form_submitted_partial"
    FORM_SUBMITTED_COMPLETE = "form_submitted_complete"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    picture: Mapped[str | None] = mapped_column(String(512), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    provider_id: Mapped[str | None] = mapped_column(String(255), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="user")
    credits: Mapped["UserCredits"] = relationship(back_populates="user", uselist=False)
    credit_transactions: Mapped[list["CreditTransaction"]] = relationship(back_populates="user")
    forms: Mapped[list["Form"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    public_forms: Mapped[list["PublicForm"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    form_uploads: Mapped[list["FormUpload"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    plan_id: Mapped[int | None] = mapped_column(ForeignKey("subscription_plans.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="inactive")
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="subscriptions")
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="subscriptions")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    stripe_price_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Legacy field, use stripe_price_id_monthly
    stripe_price_id_monthly: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_price_id_yearly: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_product_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    price_monthly: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0)
    price_yearly: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Credit configuration
    credits_per_month: Mapped[int] = mapped_column(Integer, default=0)
    credits_per_analyze: Mapped[int] = mapped_column(Integer, default=5)
    credits_per_edit: Mapped[int] = mapped_column(Integer, default=2)
    
    # Extensible features as JSON
    features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Plan management
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="plan")
    user_credits: Mapped[list["UserCredits"]] = relationship(back_populates="plan")


class UserCredits(Base):
    __tablename__ = "user_credits"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    plan_id: Mapped[int | None] = mapped_column(ForeignKey("subscription_plans.id"), nullable=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    last_reset_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped[User] = relationship(back_populates="credits")
    plan: Mapped["SubscriptionPlan"] = relationship(back_populates="user_credits")


class CreditTransaction(Base):
    __tablename__ = "credit_transactions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int] = mapped_column(Integer)  # Can be negative for deductions
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), index=True)
    description: Mapped[str] = mapped_column(Text)
    transaction_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user: Mapped[User] = relationship(back_populates="credit_transactions")


class Form(Base):
    """Form table for AI-generated forms"""
    __tablename__ = "forms"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Theme colors, submit button text, etc.
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user: Mapped[User] = relationship(back_populates="forms")
    questions: Mapped[list["FormQuestion"]] = relationship(back_populates="form", cascade="all, delete-orphan", order_by="FormQuestion.question_order")
    conditional_rules: Mapped[list["ConditionalRule"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    responses: Mapped[list["FormResponse"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    chat_messages_form: Mapped[list["ChatMessageForm"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    versions: Mapped[list["FormVersion"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    analytics_events: Mapped[list["FormAnalyticsEvent"]] = relationship(back_populates="form", cascade="all, delete-orphan")
    uploads: Mapped[list["FormUpload"]] = relationship(back_populates="form", cascade="all, delete-orphan")


class FormQuestion(Base):
    """Form questions table"""
    __tablename__ = "form_questions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    
    question_order: Mapped[int] = mapped_column(Integer)
    question_type: Mapped[QuestionType] = mapped_column(Enum(QuestionType))
    question_text: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Type-specific options (choices, validation, etc.)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    form: Mapped[Form] = relationship(back_populates="questions")
    trigger_rules: Mapped[list["ConditionalRule"]] = relationship(foreign_keys="ConditionalRule.trigger_question_id", back_populates="trigger_question", cascade="all, delete-orphan")
    target_rules: Mapped[list["ConditionalRule"]] = relationship(foreign_keys="ConditionalRule.target_question_id", back_populates="target_question", cascade="all, delete-orphan")
    answers: Mapped[list["ResponseAnswer"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    analytics_events: Mapped[list["FormAnalyticsEvent"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    uploads: Mapped[list["FormUpload"]] = relationship(back_populates="question", cascade="all, delete-orphan")


class ConditionalRule(Base):
    """Conditional logic rules for showing/hiding questions"""
    __tablename__ = "conditional_rules"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    trigger_question_id: Mapped[int] = mapped_column(ForeignKey("form_questions.id"), index=True)
    target_question_id: Mapped[int] = mapped_column(ForeignKey("form_questions.id"), index=True)
    
    condition_type: Mapped[ConditionType] = mapped_column(Enum(ConditionType))
    condition_value: Mapped[str | None] = mapped_column(Text, nullable=True)  # The value to compare against
    action: Mapped[str] = mapped_column(String(20), default="show")  # "show" or "hide"
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    form: Mapped[Form] = relationship(back_populates="conditional_rules")
    trigger_question: Mapped[FormQuestion] = relationship(foreign_keys=[trigger_question_id], back_populates="trigger_rules")
    target_question: Mapped[FormQuestion] = relationship(foreign_keys=[target_question_id], back_populates="target_rules")


class FormResponse(Base):
    """Form submission responses"""
    __tablename__ = "form_responses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    
    # Enhanced tracking fields
    status: Mapped[str] = mapped_column(String(20), default="complete", index=True)
    form_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    
    # Timestamps
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, onupdate=datetime.utcnow)
    
    # IP and geolocation
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)  # IPv6 compatible (legacy)
    ip_address_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Traffic source tracking
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    submission_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # Additional submission metadata
    
    # Relationships
    form: Mapped[Form] = relationship(back_populates="responses")
    answers: Mapped[list["ResponseAnswer"]] = relationship(back_populates="response", cascade="all, delete-orphan")
    analytics_events: Mapped[list["FormAnalyticsEvent"]] = relationship(back_populates="submission", cascade="all, delete-orphan")
    uploads: Mapped[list["FormUpload"]] = relationship(back_populates="response", cascade="all, delete-orphan")


class ResponseAnswer(Base):
    """Individual answers within a form response"""
    __tablename__ = "response_answers"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_response_id: Mapped[int] = mapped_column(ForeignKey("form_responses.id"), index=True)
    form_question_id: Mapped[int] = mapped_column(ForeignKey("form_questions.id"), index=True)
    
    answer_value: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # JSON to handle all answer types
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    response: Mapped[FormResponse] = relationship(back_populates="answers")
    question: Mapped[FormQuestion] = relationship(back_populates="answers")


class FormUpload(Base):
    """Uploaded files for form responses"""
    __tablename__ = "form_uploads"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    form_response_id: Mapped[int | None] = mapped_column(ForeignKey("form_responses.id"), nullable=True, index=True)
    form_question_id: Mapped[int] = mapped_column(ForeignKey("form_questions.id"), index=True)
    
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    original_filename: Mapped[str] = mapped_column(String(512))
    content_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    s3_key: Mapped[str] = mapped_column(String(1024), unique=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    uploaded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    attached_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    user: Mapped[User] = relationship(back_populates="form_uploads")
    form: Mapped[Form] = relationship(back_populates="uploads")
    response: Mapped["FormResponse"] = relationship(back_populates="uploads")
    question: Mapped[FormQuestion] = relationship(back_populates="uploads")


class PublicForm(Base):
    """Public shareable forms"""
    __tablename__ = "public_forms"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    share_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Settings
    allow_multiple_submissions: Mapped[bool] = mapped_column(Boolean, default=True)
    collect_email: Mapped[bool] = mapped_column(Boolean, default=False)
    custom_thank_you_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    form: Mapped[Form] = relationship()
    user: Mapped[User] = relationship(back_populates="public_forms")


class ChatMessageForm(Base):
    """Chat messages for form editing context"""
    __tablename__ = "chat_messages_form"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    
    role: Mapped[str] = mapped_column(String(20))  # "user", "assistant"
    content: Mapped[str] = mapped_column(Text)
    query_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    question_index: Mapped[int | None] = mapped_column(Integer, nullable=True)  # If related to a specific question
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    form: Mapped[Form] = relationship(back_populates="chat_messages_form")
    user: Mapped[User] = relationship()


class FormVersion(Base):
    """Form version snapshots for validation and history"""
    __tablename__ = "form_versions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    schema_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)  # Full form + questions structure
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    form: Mapped[Form] = relationship(back_populates="versions")


class FormAnalyticsEvent(Base):
    """Analytics event tracking for forms"""
    __tablename__ = "form_analytics_events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False, index=True)  # UUID
    
    # Foreign keys
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), index=True)
    submission_id: Mapped[int | None] = mapped_column(ForeignKey("form_responses.id"), nullable=True, index=True)
    question_id: Mapped[int | None] = mapped_column(ForeignKey("form_questions.id"), nullable=True, index=True)
    
    # Event details
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    
    # IP and geolocation
    ip_address_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    ip_address_raw: Mapped[str | None] = mapped_column(String(45), nullable=True)  # Only if user opts in
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Traffic source
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(255), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Event-specific data
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    event_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    form: Mapped[Form] = relationship(back_populates="analytics_events")
    submission: Mapped["FormResponse"] = relationship(back_populates="analytics_events")
    question: Mapped["FormQuestion"] = relationship(back_populates="analytics_events")


class SubmissionRateLimit(Base):
    """Rate limiting for form submissions"""
    __tablename__ = "submission_rate_limits"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    identifier: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # IP hash or device fingerprint
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), nullable=False, index=True)
    
    submission_count: Mapped[int] = mapped_column(Integer, default=0)
    window_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    form: Mapped[Form] = relationship()


class WebhookConfig(Base):
    """Webhook configuration for forms"""
    __tablename__ = "webhook_configs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("forms.id"), unique=True, nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    
    webhook_url: Mapped[str] = mapped_column(Text, nullable=False)
    secret: Mapped[str] = mapped_column(String(128), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    events: Mapped[list] = mapped_column(JSON, nullable=False)  # Array of event types to trigger on
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    form: Mapped[Form] = relationship()
    user: Mapped[User] = relationship()
