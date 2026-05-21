from src.database import Base  # noqa: F401

from src.models.users import (  # noqa: F401
    User, Parent, Teacher, Principal,
)
from src.models.academic import (  # noqa: F401
    Subject, Class, Student, ClassSubject,
)
from src.models.content import (  # noqa: F401
    Material, Video, Question,
)
from src.models.progress import (  # noqa: F401
    StudentProgress, QuizSession, QuizAnswer, VideoWatch,
    PointLog, WeeklyReport,
)
from src.models.communication import (  # noqa: F401
    Message, Notification,
)
