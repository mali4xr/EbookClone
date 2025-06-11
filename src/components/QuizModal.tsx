Here's the fixed version with all closing brackets added:

```typescript
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 font-medium transform hover:scale-105 animate__animated animate__pulse animate__infinite"
                >
                  {score === 3 ? "Continue to Next Page →" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
```
                  