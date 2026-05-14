# Requirements Document

## Introduction

FPS 초보자를 위한 웹 기반 에임 테스트 및 감도 분석 도구이다. 사용자의 에임 패턴을 측정하고, 현재 감도 성향을 분석하여, 감도 조정 방향을 제공한다. 현재 단계에서는 배포, 로그인, AI 기능 없이 프론트엔드 게임 플레이 자체를 우선 구현한다. React + Canvas 기반으로 구현하며, 어두운 FPS 스타일 UI를 사용한다. 이 문서는 초안(프로토타입) 단계로, 게임 선택 및 감도 입력 없이 핵심 테스트 기능에 집중한다.

## Glossary

- **Aim_Analyzer**: 에임 테스트 및 감도 분석을 수행하는 웹 애플리케이션 시스템
- **Start_Screen**: 테스트 시작 버튼을 포함하는 초기 화면 컴포넌트
- **Flick_Test**: 랜덤 위치에 나타나는 원형 타겟을 빠르게 클릭하는 에임 테스트 모드
- **Precision_Test**: 작은 타겟을 정밀하게 클릭하여 미세 조준 능력을 측정하는 테스트 모드
- **Result_Screen**: 테스트 결과를 분석하고 감도 조정 방향을 표시하는 화면 컴포넌트
- **Sensitivity_Engine**: rule-based 방식으로 에임 데이터를 분석하고 감도 조정 방향을 추천하는 로직 모듈
- **Over_Aim**: 타겟을 지나쳐서 마우스를 이동한 후 되돌아오는 현상
- **Under_Aim**: 타겟에 도달하지 못하고 여러 번 나누어 이동하는 현상
- **Cursor_Jitter**: 클릭 직전 커서가 미세하게 흔들리는 현상
- **Correction_Movement**: 타겟 방향으로 이동 후 방향을 수정하는 움직임
- **Mouse_Path**: 타겟 생성 시점부터 클릭 시점까지의 마우스 이동 경로 데이터
- **Canvas**: HTML5 Canvas API를 사용하는 게임 렌더링 영역

## Requirements

### Requirement 1: Start Screen

**User Story:** As an FPS beginner, I want to quickly start the aim test, so that I can begin testing my aim without complex configuration.

#### Acceptance Criteria

1. THE Start_Screen SHALL display a "Start Test" button that is always enabled
2. THE Start_Screen SHALL display a brief description of the test explaining that it measures flick aim and precision aim
3. WHEN the user clicks the "Start Test" button, THE Aim_Analyzer SHALL navigate to the Flick_Test screen

### Requirement 2: Flick Test Execution

**User Story:** As an FPS beginner, I want to perform a flick aim test with random targets, so that my reaction speed and aim accuracy can be measured.

#### Acceptance Criteria

1. WHEN the Flick_Test starts, THE Aim_Analyzer SHALL display a circular target with a radius of 30 pixels at a random position within the Canvas area, ensuring the entire target is at least 30 pixels from any Canvas edge
2. WHEN the user clicks on the Canvas, THE Aim_Analyzer SHALL record the click position, click timestamp, and time elapsed since target appearance, and determine a hit if the click position is within the target's radius from the target center
3. WHEN the user successfully hits a target, THE Aim_Analyzer SHALL display the next target at a new random position that is at least 100 pixels from the previous target's center within the next rendering frame
4. IF the user clicks on the Canvas but misses the target, THEN THE Aim_Analyzer SHALL keep the current target displayed and record the miss click without advancing to the next target
5. THE Flick_Test SHALL terminate after 30 seconds have elapsed or 20 targets have been presented, whichever occurs first, where "presented" means the target appeared regardless of hit or miss outcome
6. WHILE the Flick_Test is active, THE Aim_Analyzer SHALL record the Mouse_Path from the moment each target appears until the user clicks
7. WHILE the Flick_Test is active, THE Aim_Analyzer SHALL display the remaining time updated every second and the remaining target count updated on each successful hit
8. WHEN the Flick_Test terminates, THE Aim_Analyzer SHALL navigate to the Precision_Test screen

### Requirement 3: Flick Test Data Collection

**User Story:** As an FPS beginner, I want my aim data to be accurately collected during the flick test, so that the analysis can provide meaningful recommendations.

#### Acceptance Criteria

1. WHEN a target spawns during the Flick_Test, THE Aim_Analyzer SHALL record the target center position as x and y coordinates in pixels relative to the Canvas origin
2. WHEN the user clicks during the Flick_Test, THE Aim_Analyzer SHALL record the click position as x and y coordinates in pixels relative to the Canvas origin
3. WHEN the user clicks during the Flick_Test, THE Aim_Analyzer SHALL record the elapsed time from the current target's appearance to the click, measured in integer milliseconds
4. WHILE the Flick_Test is active, THE Aim_Analyzer SHALL sample the mouse cursor position at a minimum rate of 60 samples per second, recording each sample as x coordinate, y coordinate, and timestamp in milliseconds relative to the current target's appearance time
5. WHEN the user clicks during the Flick_Test, THE Aim_Analyzer SHALL determine Over_Aim occurrence by analyzing the Mouse_Path along the vector from the cursor's initial position to the target center, detecting whether the cursor's projected position along that vector exceeded the target center distance and subsequently decreased by at least 5 pixels before the click
6. WHEN a new target spawns during the Flick_Test, THE Aim_Analyzer SHALL begin a new Mouse_Path segment, storing the previous segment associated with its corresponding target index
7. IF the user clicks but misses the target during the Flick_Test, THEN THE Aim_Analyzer SHALL still record the click position, elapsed time, and Mouse_Path data for that target attempt

### Requirement 4: Precision Test Execution

**User Story:** As an FPS beginner, I want to perform a precision aim test with small targets, so that my fine-aiming ability can be measured.

#### Acceptance Criteria

1. WHEN the Precision_Test starts, THE Aim_Analyzer SHALL display a small circular target with a radius between 8 and 15 pixels at a random position within the Canvas area, ensuring the entire target is at least 20 pixels from any Canvas edge
2. WHEN the user clicks on the Canvas, THE Aim_Analyzer SHALL determine whether the click landed within the target boundary by calculating the Euclidean distance from the click position to the target center
3. THE Precision_Test SHALL present exactly 20 targets sequentially, advancing to the next target after each click regardless of hit or miss
4. WHEN all 20 targets have been attempted with one click each, THE Aim_Analyzer SHALL navigate to the Result_Screen
5. WHILE the Precision_Test is active, THE Aim_Analyzer SHALL display the current target number out of 20 and the cumulative hit count
6. WHILE the Precision_Test is active, THE Aim_Analyzer SHALL record the Mouse_Path from the moment each target appears until the user clicks, at a minimum rate of 60 samples per second

### Requirement 5: Precision Test Data Collection

**User Story:** As an FPS beginner, I want my precision aiming data to be collected, so that my fine-aim tendencies can be analyzed.

#### Acceptance Criteria

1. WHEN the user clicks during the Precision_Test, THE Aim_Analyzer SHALL record whether the click was a hit or miss based on whether the click position is within the target radius
2. WHEN the user clicks during the Precision_Test, THE Aim_Analyzer SHALL record the Cursor_Jitter by calculating the total cumulative Euclidean displacement of cursor positions sampled within 200 milliseconds before the click
3. WHEN the user clicks during the Precision_Test, THE Aim_Analyzer SHALL count the number of Correction_Movement instances by detecting direction changes greater than 45 degrees in the Mouse_Path for that target
4. THE Aim_Analyzer SHALL calculate the overall click success rate as the number of hits divided by 20 total attempts, expressed as a percentage

### Requirement 6: Sensitivity Analysis

**User Story:** As an FPS beginner, I want my aim data to be analyzed using clear rules, so that I can understand my aiming tendencies.

#### Acceptance Criteria

1. WHEN the Result_Screen loads, THE Sensitivity_Engine SHALL analyze the collected Flick_Test and Precision_Test data and produce tendency classifications and an accuracy score within 2 seconds
2. IF more than 50 percent of Flick_Test targets show an Over_Aim occurrence (defined as the cursor passing beyond the target center by more than the target radius before the click), THEN THE Sensitivity_Engine SHALL classify the user's tendency as Over_Aim
3. IF the average Correction_Movement count per target across all Precision_Test targets exceeds 3, THEN THE Sensitivity_Engine SHALL classify the user's tendency as Under_Aim
4. IF the average Euclidean distance between the cursor position at 100 milliseconds before click and the cursor position at click exceeds 15 pixels across all Precision_Test targets, THEN THE Sensitivity_Engine SHALL classify the user's tendency as high Cursor_Jitter
5. THE Sensitivity_Engine SHALL calculate an overall accuracy score on a scale of 0 to 100, where the score equals (hit_rate_percentage multiplied by 0.7) plus ((1 minus (average_reaction_time_ms divided by maximum_allowed_reaction_time_ms)) multiplied by 30), clamped to the range 0 to 100
6. IF none of the tendency thresholds defined in criteria 2, 3, and 4 are exceeded, THEN THE Sensitivity_Engine SHALL classify the user's tendency as Balanced
7. IF multiple tendency thresholds are exceeded simultaneously, THEN THE Sensitivity_Engine SHALL report all applicable classifications together

### Requirement 7: Sensitivity Recommendation

**User Story:** As an FPS beginner, I want to receive general sensitivity adjustment advice, so that I can understand whether to increase or decrease my sensitivity.

#### Acceptance Criteria

1. WHEN Over_Aim tendency is detected, THE Sensitivity_Engine SHALL recommend decreasing sensitivity with an explanation that the user is overshooting targets
2. WHEN Under_Aim tendency is detected, THE Sensitivity_Engine SHALL recommend increasing sensitivity with an explanation that the user is undershooting targets
3. WHEN high Cursor_Jitter is detected, THE Sensitivity_Engine SHALL recommend decreasing sensitivity with an explanation that the user's cursor is unstable near targets
4. WHEN multiple tendencies are detected simultaneously, THE Sensitivity_Engine SHALL display all applicable recommendations together, prioritized by the tendency with the highest measured severity
5. IF no Over_Aim, Under_Aim, or high Cursor_Jitter tendency is detected, THEN THE Result_Screen SHALL display a message indicating that the user's current sensitivity appears balanced and no specific adjustment is recommended
6. THE Result_Screen SHALL display each recommendation with the detected tendency name, the direction of adjustment (increase or decrease), and a one-sentence reason linking the tendency to the suggested change
7. THE Result_Screen SHALL display the user's accuracy score as a percentage rounded to one decimal place, average reaction time in milliseconds rounded to the nearest whole number, and Over_Aim percentage rounded to one decimal place

### Requirement 8: Canvas Rendering and UI

**User Story:** As an FPS beginner, I want the test interface to feel responsive and visually similar to an FPS game, so that the test conditions are realistic.

#### Acceptance Criteria

1. THE Aim_Analyzer SHALL render the test area using HTML5 Canvas with a minimum size of 800x600 pixels, a dark background with a luminance value no greater than 20 percent of maximum brightness, and the Canvas SHALL scale to fill the available viewport width while maintaining a minimum height of 600 pixels
2. THE Aim_Analyzer SHALL render Flick_Test targets as circular shapes with a radius between 20 and 40 pixels, and Precision_Test targets as circular shapes with a radius between 8 and 15 pixels, each with a contrasting dot at the center no smaller than 3 pixels in diameter
3. WHILE a test is active, THE Aim_Analyzer SHALL hide the default browser cursor and display a custom crosshair cursor centered on the current mouse position within the Canvas
4. WHILE a test is active, THE Aim_Analyzer SHALL maintain a rendering frame rate of at least 60 frames per second
5. WHEN the user clicks a target successfully, THE Aim_Analyzer SHALL display a visual hit confirmation effect at the target location lasting no more than 200 milliseconds
6. IF the rendering frame rate drops below 60 frames per second for more than 500 milliseconds, THEN THE Aim_Analyzer SHALL skip non-essential visual effects to restore the target frame rate

### Requirement 9: Application Architecture

**User Story:** As a developer, I want the application to be modular and ready for future backend integration, so that I can add server features without major refactoring.

#### Acceptance Criteria

1. THE Aim_Analyzer SHALL manage all test data in frontend state without requiring a backend server
2. THE Aim_Analyzer SHALL structure data collection modules in dedicated files that do not import from UI component files, so that data collection functions can be replaced with API calls without modifying UI components
3. THE Aim_Analyzer SHALL structure the Sensitivity_Engine as an independent module that accepts test data as input, returns analysis results, and has no dependencies on React, browser APIs, or application state management
4. WHEN a developer runs npm install followed by npm start in the project root directory, THE Aim_Analyzer SHALL compile without errors and serve the application on localhost within 60 seconds, requiring no environment variables, external services, or manual configuration steps
5. THE Aim_Analyzer SHALL include a README file containing at minimum: setup instructions, project directory structure overview, module responsibility descriptions, and guidelines for future backend integration
6. THE Aim_Analyzer SHALL ensure the Sensitivity_Engine module is testable in isolation by accepting all required data as function parameters and producing output solely through return values without side effects
